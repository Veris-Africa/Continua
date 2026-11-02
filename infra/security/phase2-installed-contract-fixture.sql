-- Production function metadata observed 2026-11-02. No customer rows or credentials.
-- Disposable fixture input only; NOT a migration.
CREATE OR REPLACE FUNCTION public.effective_subscription_plan(p_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT CASE WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at <= now() THEN 'free' ELSE subscription_plan END
  FROM public.profiles WHERE user_id=p_user_id;
$function$
;
CREATE OR REPLACE FUNCTION public.enforce_watchlist_folder_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan text;
  free_limit constant int := 1;
  premium_limit constant int := 20;
  current_count int;
BEGIN
  SELECT public.effective_subscription_plan(user_id) INTO plan FROM public.profiles WHERE user_id = NEW.user_id;
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
END $function$
;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;
DROP TRIGGER fixture_portfolio_touch ON public.portfolios;
CREATE TRIGGER fixture_portfolio_touch BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_enforce_watchlist_folder_limit BEFORE INSERT ON public.watchlist_folders FOR EACH ROW EXECUTE FUNCTION public.enforce_watchlist_folder_limit();
