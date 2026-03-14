import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { action, auction_id, max_budget, strategy, max_bids } = await req.json();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (auction_id && !uuidRegex.test(auction_id)) {
      return new Response(JSON.stringify({ error: "Invalid auction ID format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from("auto_bid_subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription) {
      return new Response(JSON.stringify({ error: "Auto-bid requires an active subscription", requires_subscription: true }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "configure") {
      // Upsert auto-bid settings
      const { data: existing } = await supabase
        .from("auto_bid_settings")
        .select("id")
        .eq("user_id", user.id)
        .eq("auction_id", auction_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("auto_bid_settings")
          .update({ max_budget, strategy: strategy || "conservative", max_bids: max_bids || 10, is_active: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("auto_bid_settings")
          .insert({ user_id: user.id, auction_id, max_budget, strategy: strategy || "conservative", max_bids: max_bids || 10 });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true, message: "Auto-bid configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "execute") {
      // AI decides whether to bid based on strategy
      const { data: settings } = await supabase
        .from("auto_bid_settings")
        .select("*")
        .eq("user_id", user.id)
        .eq("auction_id", auction_id)
        .eq("is_active", true)
        .maybeSingle();

      if (!settings) {
        return new Response(JSON.stringify({ success: false, message: "No active auto-bid settings" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get auction details
      const { data: auction } = await supabase
        .from("auctions")
        .select("*, vehicles(*)")
        .eq("id", auction_id)
        .single();

      if (!auction || auction.status !== "active") {
        return new Response(JSON.stringify({ success: false, message: "Auction not active" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Count existing auto-bids
      const { count } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("auction_id", auction_id)
        .eq("bidder_id", user.id)
        .eq("is_auto_bid", true);

      if ((count || 0) >= settings.max_bids) {
        return new Response(JSON.stringify({ success: false, message: "Max auto-bids reached" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const currentBid = auction.current_bid || auction.start_price;
      const nextBid = currentBid + auction.bid_increment;

      if (nextBid > settings.max_budget) {
        return new Response(JSON.stringify({ success: false, message: "Next bid exceeds budget" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use AI to decide based on strategy
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      let shouldBid = true;
      let aiReasoning = "Direct bid within budget";

      if (LOVABLE_API_KEY && settings.strategy !== "aggressive") {
        const vehicle = auction.vehicles;
        const prompt = `You are an auto-bidding AI for vehicle auctions. Decide whether to place a bid.

Vehicle: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}, ${vehicle?.mileage} miles, condition: ${vehicle?.condition}
Current bid: $${currentBid}, Next bid: $${nextBid}, Budget: $${settings.max_budget}
Strategy: ${settings.strategy} (conservative = bid cautiously, moderate = balanced, aggressive = bid whenever possible)
AI market value: $${vehicle?.ai_market_value || "unknown"}
Bids used: ${count || 0}/${settings.max_bids}

Should we place this bid?`;

        try {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "user", content: prompt }],
              tools: [{
                type: "function",
                function: {
                  name: "bid_decision",
                  description: "Decide whether to place a bid",
                  parameters: {
                    type: "object",
                    properties: {
                      should_bid: { type: "boolean" },
                      reasoning: { type: "string" },
                      confidence: { type: "number", minimum: 0, maximum: 100 },
                    },
                    required: ["should_bid", "reasoning", "confidence"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "bid_decision" } },
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) {
              const decision = JSON.parse(toolCall.function.arguments);
              shouldBid = decision.should_bid;
              aiReasoning = decision.reasoning;
            }
          }
        } catch (e) {
          console.error("AI decision error:", e);
          // Fall back to simple logic
        }
      }

      if (!shouldBid) {
        return new Response(JSON.stringify({ success: false, message: "AI decided not to bid", reasoning: aiReasoning }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Place the bid
      const { error: bidError } = await supabase
        .from("bids")
        .insert({ auction_id, bidder_id: user.id, amount: nextBid, is_auto_bid: true });

      if (bidError) throw bidError;

      return new Response(JSON.stringify({ success: true, amount: nextBid, reasoning: aiReasoning }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disable") {
      const { error } = await supabase
        .from("auto_bid_settings")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("auction_id", auction_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Auto-bid disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (e) {
    console.error("auto-bid error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
