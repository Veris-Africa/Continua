-- Lets comments/replies be edited (RLS already allowed UPDATE/DELETE of a
-- user's own comments — see "Users can update their own comments" /
-- "Users can delete their own comments" policies from the original
-- post_comments migration). This just adds the same edited_at marker posts
-- already have, so the UI can show "(edited)" on an edited reply.

ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;