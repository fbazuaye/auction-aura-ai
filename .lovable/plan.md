

## Current State

- **Buyer**: Every new signup automatically gets the `buyer` role (via database trigger `handle_new_user`)
- **Seller**: Only an admin can grant the seller role from the Admin Dashboard. There is no way for a user to register as or request to become a seller.
- **Admin**: No UI path exists. Admin role can only be inserted directly into the database.

## Plan

### 1. Add role selection to the signup form
- Add a toggle/select on the Auth page so users can choose "Buyer" or "Seller" during registration
- Pass the selected role as user metadata (`user_meta_data.requested_role`)
- Update the `handle_new_user` database trigger to read the requested role and assign `buyer` or `seller` accordingly (if `seller` is requested, assign both `buyer` and `seller` roles)

### 2. Database migration
- Alter the `handle_new_user` function to check `NEW.raw_user_meta_data->>'requested_role'` and insert the appropriate role(s)

### 3. Admin role setup
- Since admin is a privileged role, it should NOT be self-assignable. Keep admin assignment as a backend-only operation.
- Add a note/instruction that the first admin must be created by inserting a row into `user_roles` via the backend.

### 4. Update Auth page UI
- Show a "I want to sell vehicles" checkbox or a Buyer/Seller toggle during signup only
- Keep the login form unchanged

### 5. Update Header to show role-based links
- Show "List Vehicle" link only for sellers/admins
- Show "Admin" link only for admins
- Already partially done but verify correctness

### Technical Details

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  -- Always assign buyer role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer');
  -- If user requested seller role, also assign it
  IF NEW.raw_user_meta_data->>'requested_role' = 'seller' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
  END IF;
  RETURN NEW;
END;
$$;
```

**Auth.tsx changes:**
- Add `accountType` state (`"buyer"` | `"seller"`)
- Show two selectable cards during signup: "I want to buy" vs "I want to buy & sell"
- Pass `requested_role: accountType` in signup metadata options

**Files to modify:**
- `src/pages/Auth.tsx` — add role selection UI
- Database migration — update `handle_new_user` trigger function

