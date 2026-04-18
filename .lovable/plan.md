

## Add AI Support Chatbot to Homepage

A floating chatbot widget at the bottom of the homepage that answers user questions about how the platform works (signup, listing vehicles, bidding, approval flow, AI features, etc.) using Lovable AI.

### What gets built

**1. New edge function: `supabase/functions/support-chat/index.ts`**
- Accepts `{ messages: [{role, content}] }` from the client
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview` (fast, free tier)
- Streams the response back via SSE for token-by-token rendering
- Includes a comprehensive **system prompt** that trains the bot on platform knowledge:
  - **Signup**: Buyer (default) vs Seller role at signup, Google OAuth available, email verification required
  - **Listing flow (Sellers)**: Dashboard → "List Vehicle" → fill specs (make, model, VIN, mileage, condition, photos, videos up to 3×100MB, inspection reports up to 5×20MB, location, description, reserve price) → submit → status = `pending` → admin reviews
  - **Approval flow (Admin)**: Admin Dashboard → review pending → approve/reject → approved listings appear on homepage with active auction
  - **Bidding**: Buyers bid on active auctions, bid increments enforced, current high bid shown, 30s anti-snipe auto-extend if bid lands in final 30s, winner determined when auction ends
  - **Auto-Bid**: $9.99/mo premium AI auto-bidding feature with strategy modes
  - **AI features**: Smart Search, Damage Detection (vision AI), Market Analysis, AI condition/value scoring
  - **Auctions**: Duration set by admin (1h to 90 days), can be paused/resumed/restarted
  - **Notifications**: Outbid, ending soon, won notifications via push + email
  - System prompt instructs bot to stay on-topic (politely redirect off-topic questions) and to recommend signing up / viewing dashboard when relevant
- Handles 429 (rate limit) and 402 (credits) errors with friendly messages
- Public function (no auth required so anonymous visitors can chat)

**2. New component: `src/components/SupportChatBot.tsx`**
- Floating chat button (bottom-right, fixed position) with a chat bubble icon and subtle pulse animation matching the dark automotive theme
- Click opens a chat panel (~380px wide, ~520px tall on desktop; full-screen-ish drawer on mobile using existing Sheet/Drawer pattern)
- Header: "Ask AuctionAura AI" with close button
- Welcome message + 4 suggested quick-prompt chips: "How do I sign up as a seller?", "How do I list a vehicle?", "How does bidding work?", "How does auction approval work?"
- Message list with markdown rendering (`react-markdown` already useful — will add if not present), user messages right-aligned, AI left-aligned
- Streaming token-by-token rendering (per AI gateway best practices: line-by-line SSE parsing, update last assistant message in place, handle CRLF and `[DONE]`)
- Input field + send button at bottom; Enter to send, Shift+Enter for newline
- Loading indicator (animated dots) while AI is thinking
- Toast on rate-limit (429) or credits-exhausted (402) errors
- Conversation kept in component state only (resets on close — no persistence needed)

**3. Mount on homepage**
- Add `<SupportChatBot />` to `src/pages/Index.tsx` just before `<Footer />`
- Renders only on `/` so it doesn't clutter other pages (can be expanded later)

### Technical Details

- **No DB changes** — chat history is ephemeral, kept in component state
- **No new secrets** — `LOVABLE_API_KEY` is already configured
- **Streaming**: Uses fetch + ReadableStream reader; calls function via `${VITE_SUPABASE_URL}/functions/v1/support-chat` with the publishable key as Bearer token (per streaming pattern)
- **Markdown**: Add `react-markdown` dependency for rendering AI responses with formatting (lists, bold, links)
- **Mobile**: Chat panel collapses to a bottom sheet on viewports <768px using `useIsMobile`
- **Design**: Reuses existing tokens (primary, card, border, muted-foreground) — no hardcoded colors. Floating button uses primary color with shadow-lg

### Files
- New: `supabase/functions/support-chat/index.ts`
- New: `src/components/SupportChatBot.tsx`
- Edit: `src/pages/Index.tsx` (add component above Footer)
- Edit: `package.json` (add `react-markdown`)

