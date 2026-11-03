-- Named, multiple watchlists (moomoo-style): free users get exactly one
-- watchlist ("My Watchlist" by default, but rename-able); Premium/Premium+
-- can create as many named watchlists as they like and file each stock into
-- one or more of them.
--
-- Approach: add a `watchlist_folders` table (one row per named list) and a
-- `folder_id` FK on the existing `watchlists` table (one row per stock-in-a-
-- list). Existing rows in `watchlists` are backfilled into a new default
-- folder per user so nobody's current watchlist disappears. The old
-- UNIQUE(user_id, symbol) constraint is replaced with
-- UNIQUE(user_id, folder_id, symbol) so the same stock can now live in more
-- than one named list.

CREATE TABLE public.watchlist_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 40),
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.watchlist_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist folders" ON public.watchlist_folders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlist folders" ON public.watchlist_folders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist folders" ON public.watchlist_folders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist folders" ON public.watchlist_folders
FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- One default folder per user, created lazily the first time it's needed.
CREATE OR REPLACE FUNCTION public.get_or_create_default_watchlist_folder(p_user_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  folder_id UUID;
BEGIN
  SELECT id INTO folder_id FROM public.watchlist_folders
    WHERE user_id = p_user_id AND is_default = true LIMIT 1;

  IF folder_id IS NULL THEN
    INSERT INTO public.watchlist_folders (user_id, name, is_default, sort_order)
    VALUES (p_user_id, 'My Watchlist', true, 0)
    RETURNING id INTO folder_id;
  END IF;

  RETURN folder_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_default_watchlist_folder(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_default_watchlist_folder(UUID) TO authenticated;

-- Backfill: give every user who already has watchlist rows a default folder,
-- and point their existing rows at it.
ALTER TABLE public.watchlists ADD COLUMN folder_id UUID REFERENCES public.watchlist_folders(id) ON DELETE CASCADE;

DO $$
DECLARE
  u RECORD;
  new_folder_id UUID;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.watchlists WHERE folder_id IS NULL LOOP
    INSERT INTO public.watchlist_folders (user_id, name, is_default, sort_order)
    VALUES (u.user_id, 'My Watchlist', true, 0)
    RETURNING id INTO new_folder_id;

    UPDATE public.watchlists SET folder_id = new_folder_id
      WHERE user_id = u.user_id AND folder_id IS NULL;
  END LOOP;
END $$;

ALTER TABLE public.watchlists ALTER COLUMN folder_id SET NOT NULL;

ALTER TABLE public.watchlists DROP CONSTRAINT IF EXISTS watchlists_user_id_symbol_key;
ALTER TABLE public.watchlists ADD CONSTRAINT watchlists_user_folder_symbol_key UNIQUE (user_id, folder_id, symbol);

-- Enforce plan-based folder limits server-side (mirrors enforce_post_length_by_plan
-- from the tiered-post-length migration): free = 1 folder total, Premium/Premium+
-- can create more.
CREATE OR REPLACE FUNCTION public.enforce_watchlist_folder_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  plan text;
  free_limit constant int := 1;
  premium_limit constant int := 20;
  current_count int;
BEGIN
  SELECT subscription_plan INTO plan FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT count(*) INTO current_count FROM public.watchlist_folders WHERE user_id = NEW.user_id;

  IF plan IN ('premium', 'premium_plus') THEN
    IF current_count >= premium_limit THEN
      RAISE EXCEPTION 'You''ve reached the %-watchlist limit', premium_limit;
    END IF;
  ELSE
    IF current_count >= free_limit THEN
      RAISE EXCEPTION 'Free plan is limited to % watchlist — upgrade to Premium to create more', free_limit;
    END IF;
  END IF;

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.enforce_watchlist_folder_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_watchlist_folder_limit ON public.watchlist_folders;
CREATE TRIGGER trg_enforce_watchlist_folder_limit
  BEFORE INSERT ON public.watchlist_folders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_watchlist_folder_limit();

-- Keep updated_at fresh on rename.
CREATE OR REPLACE FUNCTION public.touch_watchlist_folder_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_touch_watchlist_folder_updated_at ON public.watchlist_folders;
CREATE TRIGGER trg_touch_watchlist_folder_updated_at
  BEFORE UPDATE ON public.watchlist_folders
  FOR EACH ROW EXECUTE FUNCTION public.touch_watchlist_folder_updated_at();

CREATE INDEX IF NOT EXISTS idx_watchlist_folders_user_id ON public.watchlist_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_folder_id ON public.watchlists(folder_id);