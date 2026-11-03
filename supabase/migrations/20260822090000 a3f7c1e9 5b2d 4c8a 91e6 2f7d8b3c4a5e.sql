-- TradersHub onboarding: replaces the old "accept a disclaimer and you're in"
-- flow with a real account-setup step (handle + interests), Moomoo-style.
-- `handle` and `tradershub_onboarded` already existed; this adds the one
-- missing piece — a set of topic/sector interest tags the person picks
-- during onboarding, which the "For You" feed ranking reads back to score
-- posts and which the "Suggested for you" people rail matches on.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- Same column-level GRANT pattern used for every other profiles column
-- (see 20260804065838 and 20260821060000) — RLS on the base table already
-- restricts writes to the owning row ("Users can update their own profile"),
-- this just makes the column itself readable/writable at all.
GRANT SELECT (interests) ON public.profiles TO authenticated;
GRANT UPDATE (interests) ON public.profiles TO authenticated;

COMMENT ON COLUMN public.profiles.interests IS
  'Sector/topic tags chosen during TradersHub onboarding (e.g. banking, telecoms, dividends). Used to personalize the For You feed and "Suggested for you" people.';