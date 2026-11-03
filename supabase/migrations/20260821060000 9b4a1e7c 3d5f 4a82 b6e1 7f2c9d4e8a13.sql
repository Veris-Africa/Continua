-- Portfolio share/privacy toggles were previously stored ONLY in the owner's
-- own browser localStorage (see PortfolioPrivacyDialog before this change).
-- That means a visitor's page load never had any way to actually see the
-- owner's chosen settings — the toggles saved, showed a success toast, and
-- then did nothing. This migration makes them real, server-side columns so
-- every visitor's request can read them, matching the pattern already used
-- for portfolio_public.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) New columns on profiles, defaulting to the least-restrictive state
--    (matches how portfolio_public already defaults to true elsewhere).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portfolio_hide_amounts boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_hide_gains boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_top_holdings_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portfolio_followers_only boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Column-level grants. Per migration 20260804065838, profiles uses
--    column-level GRANT (not row-level) for both SELECT and UPDATE, so new
--    columns need their own explicit grant or clients simply can't read or
--    write them — column privileges in Postgres are additive per GRANT
--    statement, so this does not touch any previously granted column.
GRANT SELECT (
  portfolio_hide_amounts,
  portfolio_hide_gains,
  portfolio_top_holdings_only,
  portfolio_followers_only
) ON public.profiles TO anon, authenticated;

GRANT UPDATE (
  portfolio_hide_amounts,
  portfolio_hide_gains,
  portfolio_top_holdings_only,
  portfolio_followers_only
) ON public.profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) get_public_profile / get_all_public_profiles / profiles_public need to
--    actually return the new columns, or visitors still can't see them no
--    matter what's granted above. Postgres won't let CREATE OR REPLACE
--    change a table function's RETURNS TABLE shape, so the view and both
--    functions have to be dropped and recreated in dependency order.
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
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id = target_user_id;
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
    p.created_at,
    p.updated_at
  FROM profiles p;
$$;

CREATE VIEW public.profiles_public AS
SELECT * FROM public.get_all_public_profiles();

COMMENT ON VIEW public.profiles_public IS 'Public view of profiles that excludes sensitive data like email. Use this view for all public-facing profile queries.';

-- Dropping and recreating the view drops its grants too — reinstate the
-- same explicit grant added in migration 20260202104644.
GRANT SELECT ON public.profiles_public TO authenticated, anon;