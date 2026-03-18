

## Plan: Video Upload & Live Streaming

### 1. Video Upload (on ListVehicle + VehicleDetail)

The `vehicles` table already has a `videos` text[] column. The `vehicle-media` storage bucket already exists and is public.

**Changes:**
- **`src/pages/ListVehicle.tsx`** — Add a "Videos" card section (similar to Photos) allowing up to 3 video files (mp4/webm, max 100MB each). Upload to `vehicle-media` bucket, store URLs in the `videos` column on insert.
- **`src/pages/VehicleDetail.tsx`** — Display uploaded videos below the main image using native `<video>` elements with controls. Fetch video URLs from the DB record (already returned in the query).
- **`src/components/VehicleCard.tsx`** — Optionally add a small video icon badge if the vehicle has videos.

### 2. Live Video Streaming

True live streaming (WebRTC/HLS) requires a dedicated media server which isn't available in this stack. Two practical options:

**Option A — External Stream Link (recommended, simple):**
- Add a `live_stream_url` text column to `auctions` table
- Sellers paste a YouTube Live / Twitch / any RTMP stream URL when creating an auction
- VehicleDetail embeds the stream via iframe when the auction is live
- No external service or API key needed

**Option B — WebRTC Peer-to-Peer (limited):**
- Use browser WebRTC APIs for camera streaming
- Works for small audiences (~5-10 viewers) without a media server
- Requires a signaling mechanism (could use Supabase Realtime channels)
- Fragile and doesn't scale

### Recommended Approach
Implement **video upload** fully + **Option A** (external stream URL embed) for live streaming. This gives sellers the ability to go live via YouTube/Twitch and embed it directly on the auction page.

### Files to Create/Edit
- **Edit**: `src/pages/ListVehicle.tsx` — add video upload section
- **Edit**: `src/pages/VehicleDetail.tsx` — display videos + embedded live stream
- **Migration**: Add `live_stream_url` column to `auctions` table
- **Edit**: `src/pages/ListVehicle.tsx` — add stream URL input in auction settings

### Database Change
```sql
ALTER TABLE public.auctions ADD COLUMN live_stream_url text;
```

