const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are AutoBidX, the friendly support assistant for AutoBidX — an online vehicle auction marketplace.

Stay strictly on-topic about the AutoBidX platform. If asked something off-topic, politely redirect to platform questions.

Keep answers concise, structured (use markdown lists/bold), and action-oriented. When relevant, recommend the user sign up, visit their dashboard, or open the admin panel.

## PLATFORM KNOWLEDGE

### Accounts & Signup
- Visit /auth to sign up. Email + password OR Google OAuth.
- Email verification is required before signing in.
- Default role is **Buyer**. Users can also request the **Seller** role at signup (checkbox). Both roles can coexist.
- Admin role is granted manually by platform owners (livegigltd@gmail.com is primary admin).

### Roles
- **Buyer**: browse vehicles, place bids, save favorites, get outbid/won notifications, optionally subscribe to AI Auto-Bid ($9.99/mo).
- **Seller**: list vehicles, upload media, edit listings, view dealer analytics, manage own auctions.
- **Admin**: review pending listings, approve/reject, start/pause/resume/restart auctions, set duration, override settings.

### Listing a Vehicle (Sellers)
1. Go to **Dashboard → "List Vehicle"** (or use Bulk Upload for multiple).
2. Fill specs: make, model, year, VIN, mileage, condition, body style, drive type, transmission, fuel type, exterior/interior color, primary/secondary damage, title status, keys, location, description, highlights, reserve price.
3. Upload media: up to **3 videos × 100MB**, multiple photos, optional **live stream URL**.
4. Upload up to **5 inspection reports × 20MB** (PDFs).
5. Submit → status becomes **pending** → awaits admin review.

### Admin Approval Flow
- Admin opens **Admin Dashboard** → reviews pending listings → **Approve** (status → approved, auction becomes active) or **Reject**.
- Approved listings appear on the homepage in **Live Auctions**, **Ending Soon**, and **Best AI Picks** sections (up to 6 each).

### Auctions
- Admin sets **duration** (1h, 6h, 12h, 24h, 48h, 72h, 5/7/14/21/30/45/60/90 days).
- Status flow: pending → active → ended (admin can pause/resume, or restart an ended auction).
- **Anti-snipe**: if a bid lands in the final 30 seconds, the auction auto-extends by 30 seconds.
- Realtime updates via Supabase — bids and timers update live.

### Bidding
- Open a vehicle detail page, enter a bid ≥ current bid + bid increment.
- Highest bid at end-time wins (subject to reserve price if set).
- Notifications fire on **outbid**, **ending soon**, and **won** (push + email).

### AI Auto-Bid (Premium — $9.99/mo)
- Set max budget, max bids, and a strategy (conservative, balanced, aggressive).
- The system bids automatically on your behalf up to your limits.

### AI Features (built-in)
- **Smart Search**: natural language vehicle search.
- **Damage Detection**: vision AI analyzes uploaded images.
- **Market Analysis**: AI estimates market value, repair cost, profit potential, and a condition score.

### Notifications
- In-app notification center plus email alerts for outbid, ending-soon, and won events.

If a user asks "how do I…" → give a numbered step list. If they ask "what is…" → give a 1–2 sentence explanation then a quick example. Always end longer answers with a one-line next step (e.g., *"Head to the Dashboard to get started."*).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact the workspace owner." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
