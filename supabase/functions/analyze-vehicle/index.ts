import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { make, model, year, mileage, condition, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an automotive market analyst AI. Analyze this vehicle and return structured data.

Vehicle: ${year} ${make} ${model}
Mileage: ${mileage} miles
Condition: ${condition}
Location: ${location || "USA"}

Provide your analysis as a JSON object with these fields:
- market_value: estimated market value in USD (number)
- condition_score: 1-10 score (number with 1 decimal)
- repair_cost: estimated repair cost in USD (number)
- profit_potential: 1-10 score for investment potential (number with 1 decimal)
- bid_range_low: recommended minimum bid in USD (number)
- bid_range_high: recommended maximum bid in USD (number)
- summary: brief 2-sentence analysis (string)
- risk_factors: array of 2-3 risk factors (string array)
- highlights: array of 2-3 positive highlights (string array)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an automotive market analysis AI. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "vehicle_analysis",
              description: "Return structured vehicle analysis data",
              parameters: {
                type: "object",
                properties: {
                  market_value: { type: "number", description: "Estimated market value in USD" },
                  condition_score: { type: "number", description: "Condition score 1-10" },
                  repair_cost: { type: "number", description: "Estimated repair cost in USD" },
                  profit_potential: { type: "number", description: "Profit potential score 1-10" },
                  bid_range_low: { type: "number", description: "Recommended minimum bid" },
                  bid_range_high: { type: "number", description: "Recommended maximum bid" },
                  summary: { type: "string", description: "Brief 2-sentence analysis" },
                  risk_factors: { type: "array", items: { type: "string" }, description: "Risk factors" },
                  highlights: { type: "array", items: { type: "string" }, description: "Positive highlights" },
                },
                required: ["market_value", "condition_score", "repair_cost", "profit_potential", "bid_range_low", "bid_range_high", "summary", "risk_factors", "highlights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "vehicle_analysis" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-vehicle error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
