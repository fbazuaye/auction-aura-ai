

## Problem

The `VehicleDetail` page (line 17) only looks up vehicles from the hardcoded `mockVehicles` array:

```typescript
const vehicle = mockVehicles.find((v) => v.id === id);
```

Database vehicles have UUID-based IDs (e.g., `a3f1b2c4-...`), which will never match the mock data IDs (`"1"`, `"2"`, etc.). So clicking a real listing shows "Vehicle not found."

## Plan

### Update `VehicleDetail.tsx` to fetch from the database

1. **Try mock data first** — if the `id` param matches a mock vehicle, use it (preserves existing behavior).
2. **Otherwise, fetch from the database** — query `vehicles` table by ID, joined with `auctions` and `bids`, and map the result to the `Vehicle` interface using the same `dbToVehicle` helper pattern from `Index.tsx`.
3. **Add loading state** — show a skeleton/spinner while fetching.
4. **Add real-time subscription** — subscribe to auction/bid changes for this specific vehicle so the detail page also gets live bid updates.

### Technical Details

- Query: `supabase.from('vehicles').select('*, auctions(*, bids(count))').eq('id', id).single()`
- Reuse the same field mapping logic (`images[0]` → `image`, `ai_condition_score` → `aiScore`, etc.)
- Use `useState` + `useEffect` with the route `id` as dependency
- Subscribe to `auctions` and `bids` changes filtered to this vehicle's auction for real-time updates on the detail page

### Files to Edit

- `src/pages/VehicleDetail.tsx` — add database fetch, loading state, and realtime subscription

