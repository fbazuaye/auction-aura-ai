import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { query } = await req.json();
    if (!query) throw new Error("query is required");

    // Use AI to parse natural language into structured filters
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{
          role: "user",
          content: `Parse this vehicle search query into structured filters: "${query}"
          
Available makes: Toyota, Honda, Ford, BMW, Mercedes-Benz, Jeep, Chevrolet, Nissan, Hyundai, Kia, Audi, Lexus, Subaru, Volkswagen, Tesla, etc.
Available conditions: excellent, good, fair, salvage`,
        }],
        tools: [{
          type: "function",
          function: {
            name: "search_filters",
            description: "Extract search filters from natural language query",
            parameters: {
              type: "object",
              properties: {
                make: { type: "string", description: "Vehicle make/brand, null if not specified" },
                model: { type: "string", description: "Vehicle model, null if not specified" },
                min_year: { type: "integer", description: "Minimum year" },
                max_year: { type: "integer", description: "Maximum year" },
                max_price: { type: "number", description: "Maximum price/budget in dollars" },
                min_price: { type: "number", description: "Minimum price in dollars" },
                max_mileage: { type: "integer", description: "Maximum mileage" },
                condition: { type: "string", enum: ["excellent", "good", "fair", "salvage"] },
                sort_by: { type: "string", enum: ["price_low", "price_high", "newest", "oldest", "mileage_low", "ai_score"] },
                keywords: { type: "array", items: { type: "string" }, description: "Other keywords like SUV, sedan, truck, cheap, luxury" },
              },
              required: [],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "search_filters" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Failed to parse query");

    const filters = JSON.parse(toolCall.function.arguments);

    // Query database with parsed filters
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    let dbQuery = supabase
      .from("vehicles")
      .select("*, auctions!inner(*)")
      .eq("status", "approved")
      .eq("auctions.status", "active");

    if (filters.make) dbQuery = dbQuery.ilike("make", `%${filters.make}%`);
    if (filters.model) dbQuery = dbQuery.ilike("model", `%${filters.model}%`);
    if (filters.min_year) dbQuery = dbQuery.gte("year", filters.min_year);
    if (filters.max_year) dbQuery = dbQuery.lte("year", filters.max_year);
    if (filters.max_mileage) dbQuery = dbQuery.lte("mileage", filters.max_mileage);
    if (filters.condition) dbQuery = dbQuery.ilike("condition", filters.condition);
    if (filters.max_price) dbQuery = dbQuery.lte("auctions.current_bid", filters.max_price);
    if (filters.min_price) dbQuery = dbQuery.gte("auctions.current_bid", filters.min_price);

    // Sort
    if (filters.sort_by === "price_low") dbQuery = dbQuery.order("current_bid", { ascending: true, referencedTable: "auctions" });
    else if (filters.sort_by === "price_high") dbQuery = dbQuery.order("current_bid", { ascending: false, referencedTable: "auctions" });
    else if (filters.sort_by === "newest") dbQuery = dbQuery.order("year", { ascending: false });
    else if (filters.sort_by === "oldest") dbQuery = dbQuery.order("year", { ascending: true });
    else if (filters.sort_by === "mileage_low") dbQuery = dbQuery.order("mileage", { ascending: true });
    else if (filters.sort_by === "ai_score") dbQuery = dbQuery.order("ai_condition_score", { ascending: false });

    dbQuery = dbQuery.limit(20);

    const { data: vehicles, error: dbError } = await dbQuery;
    if (dbError) throw dbError;

    return new Response(JSON.stringify({ filters, vehicles: vehicles || [], query }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
