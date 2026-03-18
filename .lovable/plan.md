

## Plan: Edit Vehicle Listings

### Approach
Reuse the existing `ListVehicle.tsx` page in edit mode by adding an optional route parameter `/edit-vehicle/:id`. When an ID is present, fetch the existing vehicle data and pre-populate the form, then update instead of insert on submit.

### Changes

**1. Add route (`src/App.tsx`)**
- Add `/edit-vehicle/:id` route pointing to `ListVehicle`

**2. Update `src/pages/ListVehicle.tsx` for edit mode**
- Accept `useParams` to detect `id` parameter
- When `id` is present:
  - Fetch the vehicle record from DB on mount and populate form state, including existing image/video URLs
  - Show existing images/videos as previews (from URLs, not File objects)
  - Change page title to "Edit Vehicle" and submit button to "Update Vehicle"
  - On submit: use `.update()` instead of `.insert()`, upload only new files, merge with existing URLs
  - Skip auction creation section in edit mode (auctions managed separately)

**3. Add Edit button in `src/pages/DealerDashboard.tsx`**
- Add a Pencil/Edit icon button next to the existing View and Delete buttons in the listings table
- Navigate to `/edit-vehicle/:id` on click

### Files
- **Edit**: `src/App.tsx` — add `/edit-vehicle/:id` route
- **Edit**: `src/pages/ListVehicle.tsx` — add edit mode with data fetching and update logic
- **Edit**: `src/pages/DealerDashboard.tsx` — add Edit action button

