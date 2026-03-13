import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, auction_id, bidder_id, amount } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (type === "outbid") {
      // Notify previous highest bidder they've been outbid
      const { data: previousBids } = await supabase
        .from("bids")
        .select("bidder_id, amount, auctions(vehicles(make, model, year))")
        .eq("auction_id", auction_id)
        .neq("bidder_id", bidder_id)
        .order("amount", { ascending: false })
        .limit(1);

      if (previousBids && previousBids.length > 0) {
        const prev = previousBids[0] as any;
        const vehicle = prev.auctions?.vehicles;
        const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "a vehicle";

        await supabase.from("notifications").insert({
          user_id: prev.bidder_id,
          type: "outbid",
          title: "You've been outbid!",
          message: `Someone placed a $${amount?.toLocaleString()} bid on ${vehicleName}. Your bid was $${prev.amount?.toLocaleString()}.`,
          data: { auction_id, amount },
        });
      }
    } else if (type === "auction_ending") {
      // Notify all bidders that auction is ending soon
      const { data: bidders } = await supabase
        .from("bids")
        .select("bidder_id, auctions(vehicles(make, model, year))")
        .eq("auction_id", auction_id);

      if (bidders) {
        const uniqueBidders = [...new Set(bidders.map((b: any) => b.bidder_id))];
        const vehicle = (bidders[0] as any)?.auctions?.vehicles;
        const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "a vehicle";

        const notifications = uniqueBidders.map((uid) => ({
          user_id: uid,
          type: "auction_ending",
          title: "Auction ending soon!",
          message: `The auction for ${vehicleName} is ending in less than 5 minutes.`,
          data: { auction_id },
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } else if (type === "auction_won") {
      // Notify winner
      const { data: auction } = await supabase
        .from("auctions")
        .select("winner_id, current_bid, vehicles(make, model, year)")
        .eq("id", auction_id)
        .single();

      if (auction && auction.winner_id) {
        const vehicle = (auction as any).vehicles;
        const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "a vehicle";

        await supabase.from("notifications").insert({
          user_id: auction.winner_id,
          type: "auction_won",
          title: "Congratulations! You won!",
          message: `You won the auction for ${vehicleName} at $${auction.current_bid?.toLocaleString()}.`,
          data: { auction_id, amount: auction.current_bid },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
