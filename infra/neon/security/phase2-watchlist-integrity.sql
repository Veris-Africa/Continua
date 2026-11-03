-- STAGING / SEPARATELY APPROVED PRODUCTION DDL ONLY. No data cleanup/backfill.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
DO $preflight$
BEGIN
 IF EXISTS(SELECT 1 FROM public.watchlist_folders WHERE is_default GROUP BY user_id HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM public.watchlists w JOIN public.watchlist_folders f ON f.id=w.folder_id WHERE w.user_id<>f.user_id) THEN
  RAISE EXCEPTION 'Watchlist data conflicts require explicit owner-reviewed remediation; no records changed';
 END IF;
END $preflight$;
CREATE UNIQUE INDEX IF NOT EXISTS watchlist_one_default_per_owner ON public.watchlist_folders(user_id) WHERE is_default;
DO $constraint$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.watchlist_folders'::regclass AND conname='watchlist_folder_owner_key') THEN
  ALTER TABLE public.watchlist_folders ADD CONSTRAINT watchlist_folder_owner_key UNIQUE(id,user_id);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.watchlists'::regclass AND conname='watchlist_owned_folder_fk') THEN
  ALTER TABLE public.watchlists ADD CONSTRAINT watchlist_owned_folder_fk FOREIGN KEY(folder_id,user_id)
   REFERENCES public.watchlist_folders(id,user_id) ON DELETE CASCADE NOT VALID;
 END IF;
END $constraint$;
ALTER TABLE public.watchlists VALIDATE CONSTRAINT watchlist_owned_folder_fk;

CREATE OR REPLACE FUNCTION public.enforce_watchlist_folder_limit()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $quota$
DECLARE plan text; current_count bigint;
BEGIN
 IF current_setting('role',true) IN ('anon','authenticated') THEN
  IF auth.uid() IS DISTINCT FROM NEW.user_id THEN RAISE EXCEPTION 'Watchlist owner mismatch' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.is_default IS DISTINCT FROM OLD.is_default) THEN
   RAISE EXCEPTION 'Watchlist ownership/default status is immutable' USING ERRCODE='42501';
  END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('continua-watchlist:'||NEW.user_id::text,0));
 IF TG_OP='UPDATE' THEN RETURN NEW; END IF;
 SELECT public.effective_subscription_plan(NEW.user_id) INTO plan;
 SELECT count(*) INTO current_count FROM public.watchlist_folders WHERE user_id=NEW.user_id;
 IF current_count>=(CASE WHEN plan IN ('premium','premium_plus') THEN 20 ELSE 1 END) THEN
  RAISE EXCEPTION 'Watchlist folder limit reached' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $quota$;
REVOKE ALL ON FUNCTION public.enforce_watchlist_folder_limit() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_enforce_watchlist_folder_limit ON public.watchlist_folders;
CREATE TRIGGER trg_enforce_watchlist_folder_limit BEFORE INSERT OR UPDATE OF user_id,is_default ON public.watchlist_folders
 FOR EACH ROW EXECUTE FUNCTION public.enforce_watchlist_folder_limit();

CREATE OR REPLACE FUNCTION public.get_or_create_default_watchlist_folder(p_user_id uuid)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $default$
DECLARE folder_id uuid;
BEGIN
 IF current_setting('role',true) IN ('anon','authenticated') AND auth.uid() IS DISTINCT FROM p_user_id THEN
  RAISE EXCEPTION 'Watchlist owner mismatch' USING ERRCODE='42501';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('continua-watchlist:'||p_user_id::text,0));
 SELECT id INTO folder_id FROM public.watchlist_folders WHERE user_id=p_user_id ORDER BY is_default DESC,created_at,id LIMIT 1;
 IF folder_id IS NULL THEN
  INSERT INTO public.watchlist_folders(user_id,name,is_default,sort_order) VALUES(p_user_id,'My Watchlist',true,0) RETURNING id INTO folder_id;
 END IF;
 RETURN folder_id;
END $default$;
REVOKE ALL ON FUNCTION public.get_or_create_default_watchlist_folder(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_default_watchlist_folder(uuid) TO authenticated;
COMMIT;
