

## Problem

The home page (`Index.tsx`) imports and displays `mockVehicles` — hardcoded static data. It never queries the database, so approved real listings are invisible on the homepage.

## Plan

### 1. Update `Index.tsx` to fetch real vehicles from the database

- Query the `vehicles` table (status = 'approved') joined with `auctions` table to get auction data (current_bid, ends_at, status, start_price, bid count)
- Use `useState` + `useEffect` to load data on mount
- Show a loading skeleton while fetching
- Keep mock vehicles as a fallback only if no real vehicles exist (or remove them entirely)

### 2. Adapt the `Vehicle` interface and `VehicleCard` component

- Create a mapped type from the database row to the existing `Vehicle` interface, or update `VehicleCard` to accept the database shape
- Map database fields: `images[0]` → `image`, `ai_condition_score` → `aiScore`, auction `current_bid` → `currentBid`, auction `ends_at` → `auctionEndsAt`, count of bids → `bidCount`, etc.
- Handle missing images gracefully (placeholder fallback)

### 3. Section logic

- **Live Auctions**: vehicles with an associated auction where `status = 'active'` and `ends_at > now()`
- **Ending Soon**: same active auctions sorted by `ends_at` ascending
- **Best AI Picks**: sorted by `ai_condition_score` descending

### 4. Keep mock data as fallback

- If no real vehicles are returned, fall back to mock data so the page isn't empty for new deployments

### Technical Details

- Query: `supabase.from('vehicles').select('*, auctions(*), bids:bids(count)').eq('status', 'approved')`
- The `VehicleCard` already uses a `Vehicle` interface with fields like `image`, `currentBid`, `isLive`, etc. — we'll create a mapping function `dbVehicleToCardVehicle()` to transform DB rows into this shape
- No database changes needed — just frontend query changes

