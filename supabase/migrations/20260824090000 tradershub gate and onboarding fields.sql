-- Expanded TradersHub onboarding brings two new self-reported fields, and
-- closes a real privacy/identity gap: every signed-up user already has a
-- `profiles` row (created at signup for the *main* Continua account), and
-- until now every public-facing profile surface (profiles_public,
-- get_public_profile, get_all_public_profiles, and SuggestedForYou's direct
-- table query) returned that row regardless of whether the person had ever
-- gone through TradersHub onboarding. Combined with lib/handle.ts's
-- fallbackHandle(), that meant someone who never touched TradersHub could
-- still turn up in "Suggested for you", handle search, and public profile
-- pages with a synthesized identity — i.e. a TradersHub presence they never
-- created. This migration makes `tradershub_onboarded = true` a hard
-- requirement for a row to be visible anywhere TradersHub-facing, so a
-- TradersHub account genuinely does not exist, in any way another user can
-- observe, until the onboarding flow's final step creates it.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) New onboarding fields.

-- Trading experience: shown publicly (like bio) as light social context —
-- e.g. a "Beginner" badge invites patience from replies, "Professional"
-- adds credibility to analysis posts. Fully optional/skippable at onboarding.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trading_experience TEXT
    CHECK (trading_experience IS NULL OR trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional'));

-- Gender: collected once, for aggregate demographic analysis of the
-- TradersHub user base only — never shown on any profile, never returned to
-- any client (not even the owner's own client) via the API. It follows the
-- same "write-only over PostgREST" treatment already used for `email` on
-- this table (see 20260804065838): the column is deliberately left out of
-- every SELECT grant below, so the only way to ever read it back is a
-- service-role / SQL-editor query run by the team.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IS NULL OR gender IN ('male', 'female', 'prefer_not_to_say'));

COMMENT ON COLUMN public.profiles.trading_experience IS
  'Self-reported experience level chosen during TradersHub onboarding. Public — shown as a badge on the profile.';
COMMENT ON COLUMN public.profiles.gender IS
  'Self-reported, collected once at TradersHub onboarding for aggregate analysis only. Intentionally NOT granted SELECT to anon/authenticated — write-only from the client, same treatment as email.';

-- trading_experience: readable and writable like every other public
-- onboarding field (bio, handle, ...).
GRANT SELECT (trading_experience) ON public.profiles TO anon, authenticated;
GRANT UPDATE (trading_experience) ON public.profiles TO authenticated;

-- gender: WRITE only. No SELECT grant for anon or authenticated on this
-- column, on purpose.
GRANT UPDATE (gender) ON public.profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Gate every public-facing profile surface behind tradershub_onboarded.
--    Postgres won't let CREATE OR REPLACE change a table function's
--    RETURNS TABLE shape, so drop and recreate in dependency order — same
--    approach as 20260821060000.

DROP VIEW IF EXISTS public.profiles_public;
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);
DROP FUNCTION IF EXISTS public.get_all_public_profiles();

CREATE FUNCTION public.get_public_profile(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  subscription_plan TEXT,
  portfolio_public BOOLEAN,
  portfolio_hide_amounts BOOLEAN,
  portfolio_hide_gains BOOLEAN,
  portfolio_top_holdings_only BOOLEAN,
  portfolio_followers_only BOOLEAN,
  followers_count INTEGER,
  following_count INTEGER,
  handle TEXT,
  tradershub_onboarded BOOLEAN,
  trading_experience TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.subscription_plan,
    p.portfolio_public,
    p.portfolio_hide_amounts,
    p.portfolio_hide_gains,
    p.portfolio_top_holdings_only,
    p.portfolio_followers_only,
    p.followers_count,
    p.following_count,
    p.handle,
    p.tradershub_onboarded,
    p.trading_experience,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = target_user_id
    AND p.tradershub_onboarded = true;
$$;

CREATE FUNCTION public.get_all_public_profiles()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  subscription_plan TEXT,
  portfolio_public BOOLEAN,
  portfolio_hide_amounts BOOLEAN,
  portfolio_hide_gains BOOLEAN,
  portfolio_top_holdings_only BOOLEAN,
  portfolio_followers_only BOOLEAN,
  followers_count INTEGER,
  following_count INTEGER,
  handle TEXT,
  tradershub_onboarded BOOLEAN,
  trading_experience TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.subscription_plan,
    p.portfolio_public,
    p.portfolio_hide_amounts,
    p.portfolio_hide_gains,
    p.portfolio_top_holdings_only,
    p.portfolio_followers_only,
    p.followers_count,
    p.following_count,
    p.handle,
    p.tradershub_onboarded,
    p.trading_experience,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.tradershub_onboarded = true;
$$;

CREATE VIEW public.profiles_public AS
SELECT * FROM public.get_all_public_profiles();

COMMENT ON VIEW public.profiles_public IS
  'Public view of TradersHub profiles. Only rows where tradershub_onboarded = true are visible — a person who has not completed TradersHub onboarding has no TradersHub presence here or anywhere else client-facing. Excludes sensitive data like email and gender. Use this view for all public-facing profile queries.';

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Optional read-back for the person's own private analysis-only fields.
--    Nothing in the app calls this yet (onboarding is write-once and never
--    needs to redisplay a past answer), but it's here so a future "edit
--    your demographic info" screen in Settings has a safe way to read the
--    owner's own gender without ever exposing it via the profiles table or
--    profiles_public.
CREATE OR REPLACE FUNCTION public.get_my_private_profile_fields()
RETURNS TABLE (gender TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.gender FROM profiles p WHERE p.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_private_profile_fields() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile_fields() TO authenticated;