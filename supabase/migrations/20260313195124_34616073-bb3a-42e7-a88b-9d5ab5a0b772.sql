
-- Fix: restrict notification inserts to authenticated users inserting for themselves
-- Edge functions use service_role which bypasses RLS anyway
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
