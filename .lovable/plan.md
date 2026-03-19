

## Investigation Results

The 2017 MERCEDES-BENZ GLE 350 4MATIC **is correctly stored** in the database:
- Vehicle status: `approved`
- Auction status: `active`
- Auction ends: March 26 (in the future)
- Has an image uploaded

**Root cause**: The homepage "Live Auctions" section only displays **3 vehicles** (`liveVehicles.slice(0, 3)`). There are currently **4 live database vehicles** plus **5 live mock vehicles** = 9 total. Which 3 appear depends on the query return order, and the Mercedes GLE may be the 4th.

## Plan

### 1. Show all live database vehicles on the homepage
- Remove the `slice(0, 3)` limit on the Live Auctions section, or increase it (e.g., to 6 or 9)
- Add a "View All" link that already exists pointing to `/dashboard`

### 2. Prioritize real listings over mock data
- Sort the `liveVehicles` array so database vehicles appear before mock vehicles (they already do by array order, but we can make it explicit)

### 3. Optional: Remove or reduce mock vehicles
- Consider removing mock vehicles entirely now that real listings exist, or only show them as fallback when fewer than 3 real vehicles exist

### Technical Details
- **File**: `src/pages/Index.tsx` — change `liveVehicles.slice(0, 3)` to show more vehicles (e.g., `slice(0, 6)`)
- Same change for "Ending Soon" and "Best AI Picks" sections if needed
- Optionally filter out mock vehicles when sufficient DB vehicles exist

