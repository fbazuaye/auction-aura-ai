import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { image_url, vehicle_info } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    const prompt = `Analyze this vehicle image for damage. ${vehicle_info ? `Vehicle: ${vehicle_info}` : ""}
Examine carefully for dents, scratches, rust, paint damage, broken parts, frame damage, tire wear, glass cracks, etc.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "damage_report",
            description: "Report detected vehicle damage areas",
            parameters: {
              type: "object",
              properties: {
                overall_condition: { type: "string", enum: ["excellent", "good", "fair", "poor", "salvage"] },
                overall_score: { type: "number", minimum: 0, maximum: 100 },
                damages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string", description: "Location of damage (e.g. front bumper, driver door)" },
                      type: { type: "string", description: "Type of damage (e.g. dent, scratch, rust)" },
                      severity: { type: "string", enum: ["minor", "moderate", "severe"] },
                      estimated_repair_cost: { type: "number" },
                      description: { type: "string" },
                    },
                    required: ["area", "type", "severity", "estimated_repair_cost", "description"],
                    additionalProperties: false,
                  },
                },
                total_repair_cost: { type: "number" },
                summary: { type: "string" },
              },
              required: ["overall_condition", "overall_score", "damages", "total_repair_cost", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "damage_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis returned");

    const report = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-damage error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
