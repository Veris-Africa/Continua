-- TradersHub long-form posts: free stays a short-post limit, Premium gets
-- article-length posts (Moomoo-style long-form community posts).
--
-- The DB currently hard-caps posts.content at 2000 chars for everyone
-- (posts_content_length, added in the 2026-08-13 security audit migration).
-- Raise that ceiling so Premium has room to write something article-length,
-- and add a trigger that enforces the *free* tier's shorter limit — this
-- can't be done with a plain CHECK constraint since it needs to look up the
-- author's subscription_plan on profiles. Enforcing this server-side (not
-- just in the compose UI) matches how subscription_plan itself was locked
-- down in the previous migration: a client bypassing the app UI shouldn't
-- be able to bypass the limit either.

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_content_length,
  ADD CONSTRAINT posts_content_length CHECK (char_length(content) <= 5000) NOT VALID;

CREATE OR REPLACE FUNCTION public.enforce_post_length_by_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  plan text;
  free_limit constant int := 500;
  premium_limit constant int := 5000;
BEGIN
  SELECT subscription_plan INTO plan FROM public.profiles WHERE user_id = NEW.user_id;

  IF plan IN ('premium', 'premium_plus') THEN
    IF char_length(NEW.content) > premium_limit THEN
      RAISE EXCEPTION 'Post exceeds the %-character Premium limit', premium_limit;
    END IF;
  ELSE
    IF char_length(NEW.content) > free_limit THEN
      RAISE EXCEPTION 'Post exceeds the %-character free limit — upgrade to Premium for long-form posts', free_limit;
    END IF;
  END IF;

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.enforce_post_length_by_plan() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_post_length_by_plan ON public.posts;
CREATE TRIGGER trg_enforce_post_length_by_plan
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_length_by_plan();

-- OPTIONAL — run once you've verified there's no existing row between 2000
-- and 5000 chars that would need review first (there shouldn't be any,
-- since 2000 was previously the hard ceiling for everyone).
-- ALTER TABLE public.posts VALIDATE CONSTRAINT posts_content_length;