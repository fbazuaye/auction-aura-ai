
-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  vin TEXT UNIQUE,
  condition TEXT NOT NULL DEFAULT 'good',
  location TEXT,
  description TEXT,
  reserve_price NUMERIC(12,2),
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  inspection_reports TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  ai_market_value NUMERIC(12,2),
  ai_condition_score NUMERIC(4,2),
  ai_repair_cost NUMERIC(12,2),
  ai_profit_potential NUMERIC(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved vehicles" ON public.vehicles FOR SELECT USING (status = 'approved' OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sellers can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = seller_id AND (public.has_role(auth.uid(), 'seller') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Sellers can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vehicles" ON public.vehicles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create auctions table
CREATE TABLE public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_price NUMERIC(12,2) NOT NULL,
  reserve_price NUMERIC(12,2),
  current_bid NUMERIC(12,2),
  bid_increment NUMERIC(12,2) NOT NULL DEFAULT 100,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  original_end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view auctions" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Sellers/admins can create auctions" ON public.auctions FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'seller') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can update auctions" ON public.auctions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auctions" ON public.auctions FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_auctions_updated_at BEFORE UPDATE ON public.auctions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  is_auto_bid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bids" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can place bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

CREATE INDEX idx_bids_auction_id ON public.bids(auction_id);
CREATE INDEX idx_bids_bidder_id ON public.bids(bidder_id);
CREATE INDEX idx_auctions_vehicle_id ON public.auctions(vehicle_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_seller_id ON public.vehicles(seller_id);

-- Saved vehicles table
CREATE TABLE public.saved_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vehicle_id)
);

ALTER TABLE public.saved_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved" ON public.saved_vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save vehicles" ON public.saved_vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave vehicles" ON public.saved_vehicles FOR DELETE USING (auth.uid() = user_id);

-- Auto-bid settings table
CREATE TABLE public.auto_bid_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  max_budget NUMERIC(12,2) NOT NULL,
  strategy TEXT NOT NULL DEFAULT 'conservative',
  max_bids INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, auction_id)
);

ALTER TABLE public.auto_bid_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-bid" ON public.auto_bid_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create auto-bid" ON public.auto_bid_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own auto-bid" ON public.auto_bid_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own auto-bid" ON public.auto_bid_settings FOR DELETE USING (auth.uid() = user_id);

-- Function to extend auction if bid in last 30 seconds
CREATE OR REPLACE FUNCTION public.extend_auction_on_late_bid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auction_end TIMESTAMPTZ;
BEGIN
  SELECT ends_at INTO auction_end FROM public.auctions WHERE id = NEW.auction_id;
  
  IF auction_end - now() < INTERVAL '30 seconds' THEN
    UPDATE public.auctions 
    SET ends_at = ends_at + INTERVAL '30 seconds'
    WHERE id = NEW.auction_id;
  END IF;
  
  -- Update current bid on auction
  UPDATE public.auctions SET current_bid = NEW.amount WHERE id = NEW.auction_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bid_placed
  AFTER INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.extend_auction_on_late_bid();

-- Storage bucket for vehicle media
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-media', 'vehicle-media', true);

CREATE POLICY "Anyone can view vehicle media" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-media');
CREATE POLICY "Sellers can upload vehicle media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'vehicle-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-media' AND auth.uid()::text = (storage.foldername(name))[1]);
