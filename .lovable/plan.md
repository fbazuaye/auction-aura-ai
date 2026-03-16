

## Plan: Dealer Dashboard, Bulk Car Upload, and Dealer Analytics

### Overview
Build a dedicated dealer experience with three features: a dealer-specific dashboard, bulk vehicle upload via CSV, and analytics showing sales performance. These will be accessible to users with the `seller` role.

### 1. Dealer Dashboard (`src/pages/DealerDashboard.tsx`)
- New page at `/dealer` route, restricted to users with `seller` role
- Sidebar layout using the existing Shadcn Sidebar component
- Sections:
  - **My Listings** — table of all vehicles listed by this seller (all statuses: pending, approved, rejected), with quick actions (edit, delete)
  - **My Auctions** — active/scheduled/ended auctions for this seller's vehicles, showing current bid, time left, bid count
  - **Recent Bids** — bids received on this seller's auctions
  - **Quick Stats** — total listings, active auctions, total revenue (from ended auctions), average sale price

### 2. Bulk Car Upload (`src/pages/BulkUpload.tsx`)
- New page at `/dealer/bulk-upload`, seller role required
- Two upload methods:
  - **CSV Upload** — user uploads a CSV file with columns: make, model, year, mileage, vin, condition, location, description, reserve_price. Parse client-side, show preview table, then batch insert into `vehicles` table
  - **Manual Multi-Form** — a repeatable form card to add multiple vehicles at once before submitting all
- Validation: check required fields (make, model, year, mileage, condition), show errors per row
- All inserted vehicles get `status: 'pending'` and the current user as `seller_id`
- No image upload in bulk mode (can be added per vehicle later)

### 3. Dealer Analytics (`src/pages/DealerAnalytics.tsx`)
- New page at `/dealer/analytics`, seller role required
- Queries:
  - Seller's vehicles joined with auctions and bids to compute metrics
  - Total vehicles listed, total sold (auction ended + has winner), total revenue, average selling price
  - Bid activity over time (bids per day/week on seller's auctions)
- Charts using Recharts (already available via shadcn chart component):
  - Bar chart: listings by status (pending/approved/rejected)
  - Line chart: bid activity over last 30 days
  - Summary cards: total revenue, avg sale price, conversion rate (listed vs sold)

### 4. Routing and Navigation
- Add routes in `App.tsx`: `/dealer`, `/dealer/bulk-upload`, `/dealer/analytics`
- Add a "Dealer" link in the Header for users with seller role
- Dealer dashboard uses a simple tab or sidebar nav to switch between the three sections

### Files to Create/Edit
- **Create**: `src/pages/DealerDashboard.tsx` — main dealer dashboard with listings & auctions
- **Create**: `src/pages/BulkUpload.tsx` — CSV parser + batch insert
- **Create**: `src/pages/DealerAnalytics.tsx` — charts and metrics
- **Edit**: `src/App.tsx` — add 3 new routes
- **Edit**: `src/components/Header.tsx` — add dealer nav link for sellers

### No Database Changes Required
All data already exists in `vehicles`, `auctions`, and `bids` tables. Queries will filter by `seller_id = auth.uid()`. Existing RLS policies already allow sellers to view their own vehicles and public auction/bid data.

