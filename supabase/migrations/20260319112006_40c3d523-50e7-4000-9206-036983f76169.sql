
ALTER TABLE public.vehicles
  ADD COLUMN body_style text,
  ADD COLUMN exterior_color text,
  ADD COLUMN interior_color text,
  ADD COLUMN engine_type text,
  ADD COLUMN transmission text,
  ADD COLUMN drive_type text,
  ADD COLUMN fuel_type text,
  ADD COLUMN cylinders integer,
  ADD COLUMN title_status text,
  ADD COLUMN primary_damage text,
  ADD COLUMN secondary_damage text,
  ADD COLUMN keys_available boolean DEFAULT true,
  ADD COLUMN highlights text[] DEFAULT '{}'::text[];
