import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Gauge, Calendar, Hash, Zap, TrendingUp, Wrench, DollarSign, Video, Car, Fuel, Key, Palette, FileText, Download } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AuctionTimer from "@/components/AuctionTimer";
import AutoBidPanel from "@/components/AutoBidPanel";
import DamageDetection from "@/components/DamageDetection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { mockVehicles, Vehicle } from "@/data/mockVehicles";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function dbToVehicle(v: any): Vehicle & { videos?: string[]; live_stream_url?: string; body_style?: string; exterior_color?: string; interior_color?: string; engine_type?: string; transmission?: string; drive_type?: string; fuel_type?: string; cylinders?: number; title_status?: string; primary_damage?: string; secondary_damage?: string; keys_available?: boolean; highlights?: string[] } {
  const auction = v.auctions?.[0];
  const bidCount = auction?.bids?.[0]?.count ?? 0;
  const firstImage = v.images?.[0]
    ? (v.images[0].startsWith("http") ? v.images[0] : `${SUPABASE_URL}/storage/v1/object/public/vehicle-media/${v.images[0]}`)
    : "/placeholder.svg";

  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: v.mileage,
    vin: v.vin ?? "",
    condition: (v.condition?.charAt(0).toUpperCase() + v.condition?.slice(1)) as Vehicle["condition"],
    location: v.location ?? "Unknown",
    image: firstImage,
    currentBid: auction?.current_bid ?? auction?.start_price ?? 0,
    startPrice: auction?.start_price ?? 0,
    reservePrice: auction?.reserve_price ?? v.reserve_price ?? 0,
    bidCount,
    auctionEndsAt: auction ? new Date(auction.ends_at) : new Date(),
    isLive: auction?.status === "active",
    aiScore: v.ai_condition_score ?? 0,
    estimatedValue: v.ai_market_value ?? 0,
    repairCost: v.ai_repair_cost ?? 0,
    profitPotential: v.ai_profit_potential ?? 0,
    videos: v.videos ?? [],
    live_stream_url: auction?.live_stream_url ?? null,
    body_style: v.body_style ?? null,
    exterior_color: v.exterior_color ?? null,
    interior_color: v.interior_color ?? null,
    engine_type: v.engine_type ?? null,
    transmission: v.transmission ?? null,
    drive_type: v.drive_type ?? null,
    fuel_type: v.fuel_type ?? null,
    cylinders: v.cylinders ?? null,
    title_status: v.title_status ?? null,
    primary_damage: v.primary_damage ?? null,
    secondary_damage: v.secondary_damage ?? null,
    keys_available: v.keys_available ?? null,
    highlights: v.highlights ?? [],
  };
}

const VehicleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<(Vehicle & { videos?: string[]; live_stream_url?: string; body_style?: string; exterior_color?: string; interior_color?: string; engine_type?: string; transmission?: string; drive_type?: string; fuel_type?: string; cylinders?: number; title_status?: string; primary_damage?: string; secondary_damage?: string; keys_available?: boolean; highlights?: string[] }) | null | undefined>(undefined);
  const [bidAmount, setBidAmount] = useState(0);

  const fetchFromDb = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("vehicles")
      .select("*, auctions(*, bids(count))")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      setVehicle(dbToVehicle(data));
    } else {
      setVehicle(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // Try mock first
    const mock = mockVehicles.find((v) => v.id === id);
    if (mock) {
      setVehicle(mock);
      return;
    }
    // Fetch from DB
    fetchFromDb();
  }, [id, fetchFromDb]);

  // Realtime subscription for DB vehicles
  useEffect(() => {
    if (!id || mockVehicles.some((v) => v.id === id)) return;

    const channel = supabase
      .channel(`vehicle-detail-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "auctions" }, (payload) => {
        if ((payload.new as any).vehicle_id === id) fetchFromDb();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bids" }, () => {
        fetchFromDb();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchFromDb]);

  if (vehicle === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vehicle not found.</p>
      </div>
    );
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const nextBid = vehicle.currentBid + 500;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />

      <main className="container py-4 md:py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Auctions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Image + Specs */}
          <div className="lg:col-span-3 space-y-4">
            {/* Image */}
            <div className="relative rounded-lg overflow-hidden aspect-[16/10]">
              <img
                src={vehicle.image}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              {vehicle.isLive && (
                <Badge variant="live" className="absolute top-3 left-3">● LIVE AUCTION</Badge>
              )}
            </div>

            {/* Live Stream */}
            {vehicle.isLive && vehicle.live_stream_url && (
              <div className="rounded-lg overflow-hidden border border-primary/30 bg-card">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border-b border-border">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm font-semibold text-foreground">Live Stream</span>
                </div>
                <div className="aspect-video">
                  <iframe
                    src={vehicle.live_stream_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Live Stream"
                  />
                </div>
              </div>
            )}

            {/* Uploaded Videos */}
            {vehicle.videos && vehicle.videos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" /> Videos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicle.videos.map((url, i) => (
                    <video
                      key={i}
                      src={url}
                      controls
                      preload="metadata"
                      className="w-full rounded-lg border border-border aspect-video bg-black"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">VIN: {vehicle.vin}</p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Gauge, label: "Mileage", value: `${vehicle.mileage.toLocaleString()} mi` },
                { icon: Calendar, label: "Year", value: vehicle.year },
                { icon: MapPin, label: "Location", value: vehicle.location.split(",")[0] },
                { icon: Hash, label: "Condition", value: vehicle.condition },
              ].map((spec) => (
                <div key={spec.label} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <spec.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{spec.label}</span>
                  </div>
                  <p className="font-display font-semibold text-foreground">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Vehicle Specifications */}
            {(vehicle.body_style || vehicle.engine_type || vehicle.transmission || vehicle.drive_type || vehicle.fuel_type || vehicle.exterior_color || vehicle.interior_color || vehicle.cylinders) && (
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" /> Vehicle Specifications
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Body Style", value: vehicle.body_style },
                    { label: "Exterior Color", value: vehicle.exterior_color },
                    { label: "Interior Color", value: vehicle.interior_color },
                    { label: "Engine", value: vehicle.engine_type },
                    { label: "Transmission", value: vehicle.transmission },
                    { label: "Drive Type", value: vehicle.drive_type },
                    { label: "Fuel Type", value: vehicle.fuel_type },
                    { label: "Cylinders", value: vehicle.cylinders ? String(vehicle.cylinders) : null },
                  ].filter(s => s.value).map(spec => (
                    <div key={spec.label} className="py-2 border-b border-border last:border-0">
                      <p className="text-xs text-muted-foreground">{spec.label}</p>
                      <p className="text-sm font-semibold text-foreground">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Title & Damage Info */}
            {(vehicle.title_status || vehicle.primary_damage || vehicle.keys_available !== undefined || (vehicle.highlights && vehicle.highlights.length > 0)) && (
              <div className="p-4 rounded-lg bg-card border border-border">
                <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary" /> Title & Damage Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Title Status", value: vehicle.title_status },
                    { label: "Primary Damage", value: vehicle.primary_damage },
                    { label: "Secondary Damage", value: vehicle.secondary_damage },
                    { label: "Keys Available", value: vehicle.keys_available !== null && vehicle.keys_available !== undefined ? (vehicle.keys_available ? "Yes" : "No") : null },
                  ].filter(s => s.value).map(spec => (
                    <div key={spec.label} className="py-2 border-b border-border last:border-0">
                      <p className="text-xs text-muted-foreground">{spec.label}</p>
                      <p className="text-sm font-semibold text-foreground">{spec.value}</p>
                    </div>
                  ))}
                </div>
                {vehicle.highlights && vehicle.highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vehicle.highlights.map(h => (
                      <Badge key={h} variant="secondary">{h}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-display font-semibold text-foreground mb-3">Bid History</h3>
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0 text-sm">
                    <span className="text-muted-foreground">Bidder #{vehicle.bidCount - i}</span>
                    <span className="font-display font-semibold text-foreground tabular-nums">
                      {formatPrice(vehicle.currentBid - i * 500)}
                    </span>
                    <span className="text-xs text-muted-foreground">{i * 3 + 1}m ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Bidding Console + AI Insights */}
          <div className="lg:col-span-2 space-y-4">
            {/* Bidding Console */}
            <div className="p-5 rounded-lg bg-card border border-primary/20 space-y-4 sticky top-20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Time Remaining</span>
                <AuctionTimer endsAt={vehicle.auctionEndsAt} />
              </div>

              <div className="text-center py-4 border-y border-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current Bid</p>
                <p className="font-display text-4xl font-bold text-foreground tabular-nums">
                  {formatPrice(vehicle.currentBid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{vehicle.bidCount} bids</p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="bid"
                  size="lg"
                  className="w-full text-lg"
                  onClick={() => navigate("/auth")}
                >
                  Bid {formatPrice(nextBid + bidAmount)}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map((inc) => (
                    <Button key={inc} variant="outline" size="sm" className="text-xs" onClick={() => setBidAmount(prev => prev + inc)}>
                      +{formatPrice(inc)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Auto-bid panel */}
              <AutoBidPanel auctionId={vehicle.id} currentBid={vehicle.currentBid} bidIncrement={500} />
            </div>

            {/* AI Insights Panel */}
            <div className="p-5 rounded-lg bg-card border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-foreground">AI Insights</h3>
              </div>

              <div className="space-y-3">
                {[
                  { icon: DollarSign, label: "Est. Market Value", value: formatPrice(vehicle.estimatedValue), color: "text-foreground" },
                  { icon: TrendingUp, label: "Profit Potential", value: `+${formatPrice(vehicle.profitPotential)}`, color: "text-success" },
                  { icon: Wrench, label: "Est. Repair Cost", value: formatPrice(vehicle.repairCost), color: vehicle.repairCost > 0 ? "text-accent" : "text-success" },
                  { icon: Zap, label: "AI Score", value: `${vehicle.aiScore}/100`, color: vehicle.aiScore >= 85 ? "text-success" : "text-foreground" },
                ].map((insight) => (
                  <div key={insight.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <insight.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{insight.label}</span>
                    </div>
                    <span className={`font-display font-bold tabular-nums ${insight.color}`}>{insight.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
                Powered by AutoBidX AI • Analysis based on market data and vehicle condition
              </p>
            </div>

            {/* Damage Detection */}
            <div className="p-5 rounded-lg bg-card border border-primary/20">
              <DamageDetection />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default VehicleDetail;
