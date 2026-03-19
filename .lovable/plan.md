

## Add Detailed Vehicle Specifications to Listing Form

Currently the listing form captures only basic info: make, model, year, mileage, VIN, condition, location, description, and reserve price. Inspired by Copart's detailed lot pages, we can add many more fields that buyers rely on to make bidding decisions.

### New Fields to Add

**Vehicle Specifications:**
- Body Style (Sedan, SUV, Truck, Coupe, Convertible, Van, Wagon, Hatchback)
- Exterior Color
- Interior Color
- Engine Type (e.g., "2.5L 4-Cylinder", "3.5L V6")
- Transmission (Automatic, Manual, CVT)
- Drive Type (FWD, RWD, AWD, 4WD)
- Fuel Type (Gasoline, Diesel, Hybrid, Electric, Plug-in Hybrid)
- Cylinders (3, 4, 5, 6, 8, 10, 12)

**Title & Damage Info:**
- Title Status (Clean, Salvage, Rebuilt, Flood, Lemon)
- Primary Damage (Front End, Rear End, Side, Rollover, Vandalism, Hail, Flood, Mechanical, None)
- Secondary Damage (same options, optional)
- Keys Available (Yes / No)
- Highlights (Run & Drive, Enhanced Vehicles, Donation, etc.)

### Implementation Steps

1. **Database migration** — Add new nullable text columns to the `vehicles` table: `body_style`, `exterior_color`, `interior_color`, `engine_type`, `transmission`, `drive_type`, `fuel_type`, `cylinders`, `title_status`, `primary_damage`, `secondary_damage`, `keys_available` (boolean), `highlights` (text array).

2. **Update ListVehicle.tsx** — Expand the form state and UI with two new Card sections:
   - "Vehicle Specifications" card with dropdowns/inputs for body style, colors, engine, transmission, drive, fuel, cylinders
   - "Title & Damage Information" card with dropdowns for title status, damage types, keys toggle, and highlights multi-select

3. **Update submit handler** — Include the new fields in both insert and update operations.

4. **Update edit-mode fetch** — Pre-populate the new fields when editing an existing vehicle.

5. **Update VehicleDetail.tsx** — Display the new specifications in a details/specs section on the vehicle detail page, similar to Copart's lot info grid.

### Technical Details

- All new columns are nullable with no defaults (except `keys_available` defaulting to `true`), so existing listings remain unaffected.
- No RLS changes needed — existing vehicle policies already cover these columns.
- The `dbToVehicle` mapper and detail page will be updated to surface the new fields.

