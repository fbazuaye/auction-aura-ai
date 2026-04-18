

## Increase video upload limit from 100MB → 200MB

### Changes

**1. `src/pages/ListVehicle.tsx`** — frontend validation
- Line 215: change `100 * 1024 * 1024` → `200 * 1024 * 1024`
- Line 217: toast text `"Each video must be under 100MB"` → `"Each video must be under 200MB"`
- Line 811: helper text `"max 100MB each"` → `"max 200MB each"`

**2. `supabase/functions/support-chat/index.ts`** — chatbot system prompt
- Line 29: `3 videos × 100MB` → `3 videos × 200MB`

**3. Storage bucket `vehicle-media`** — backend limit
- Migration to set `file_size_limit = 209715200` (200MB) on the `vehicle-media` bucket so Supabase Storage accepts files up to 200MB.

**4. Memory update** — `mem://features/media-capabilities`
- Update from "3x100MB videos" to "3x200MB videos" (and the index Core entry referencing it).

### Notes
- No DB schema changes — only the storage bucket's size limit attribute.
- Supabase Storage hard cap on the platform supports 200MB uploads via standard upload; no resumable upload changes required.
- After this ships, do a hard refresh to bypass cached JS.

