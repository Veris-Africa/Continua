-- SEPARATE SECURITY RELEASE. Production requires specific approval and ACL capture.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
SET LOCAL search_path=pg_catalog;
DO $acl$
DECLARE target text; browser_role text; privilege text;
BEGIN
 FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF has_schema_privilege(browser_role,'public','CREATE') THEN RAISE EXCEPTION 'Untrusted public schema CREATE requires separate privilege review: %',browser_role; END IF;
 END LOOP;
 FOREACH target IN ARRAY ARRAY['ai_recommendations','blocked_users','comment_likes','comment_reactions','comment_reposts','dividends','engine_cash_flows','engine_preferences','hidden_posts','muted_keywords','muted_users','notifications','payment_methods','portfolio_snapshots','portfolios','post_bookmarks','post_comments','post_likes','post_poll_votes','post_reactions','post_reports','post_reposts','posts','price_alerts','profiles','profiles_public','research_usage','room_members','room_messages','rooms','user_follows','user_preferences','watchlist_folders','watchlists'] LOOP
  IF to_regclass(format('public.%I',target)) IS NULL THEN RAISE EXCEPTION 'Reviewed application relation missing: %',target; END IF;
  EXECUTE format('REVOKE TRUNCATE,TRIGGER,REFERENCES,MAINTAIN ON TABLE public.%I FROM anon,authenticated RESTRICT',target);
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
   FOREACH privilege IN ARRAY ARRAY['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'] LOOP
    IF privilege='REFERENCES' AND has_any_column_privilege(browser_role,format('public.%I',target),'REFERENCES') THEN RAISE EXCEPTION 'Column-level administrative grant requires separate review: % %',target,browser_role; END IF;
    IF has_table_privilege(browser_role,format('public.%I',target),privilege) THEN RAISE EXCEPTION 'Effective browser administrative grant remains: % % %',target,browser_role,privilege; END IF;
   END LOOP;
  END LOOP;
 END LOOP;
END $acl$;
-- Harden only the reviewed public-schema SECURITY DEFINER search-path pattern.
-- Keep existing RPC execution grants. Trigger-only helpers need no direct browser EXECUTE.
DO $functions$
DECLARE f record; service_before boolean;
BEGIN
 FOR f IN SELECT p.oid,p.proname,p.prorettype FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef AND p.proconfig @> ARRAY['search_path=public']
   AND p.oid=ANY(ARRAY[to_regprocedure('public.bump_room_member_count()')::oid,to_regprocedure('public.enforce_post_length_by_plan()')::oid,to_regprocedure('public.enforce_watchlist_folder_limit()')::oid,to_regprocedure('public.get_or_create_default_watchlist_folder(uuid)')::oid,to_regprocedure('public.get_public_profile(uuid)')::oid,to_regprocedure('public.get_research_quota(text)')::oid,to_regprocedure('public.handle_new_user()')::oid,to_regprocedure('public.is_room_member(uuid,uuid)')::oid,to_regprocedure('public.is_room_visible(uuid,uuid)')::oid,to_regprocedure('public.notify_on_comment()')::oid,to_regprocedure('public.notify_on_follow()')::oid,to_regprocedure('public.notify_on_like()')::oid,to_regprocedure('public.notify_on_price_alert_created()')::oid,to_regprocedure('public.notify_on_repost()')::oid,to_regprocedure('public.post_poll_result(uuid,integer)')::oid,to_regprocedure('public.record_research_view(text)')::oid,to_regprocedure('public.update_updated_at_column()')::oid])
 LOOP
  EXECUTE format('ALTER FUNCTION %s SET search_path=pg_catalog,public,pg_temp',f.oid::regprocedure);
  IF f.prorettype='pg_catalog.trigger'::regtype THEN
   service_before:=has_function_privilege('service_role',f.oid,'EXECUTE');
   EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC,anon,authenticated RESTRICT',f.oid::regprocedure);
   IF service_before AND NOT has_function_privilege('service_role',f.oid,'EXECUTE') THEN
    RAISE EXCEPTION 'Service execution depends on PUBLIC; explicit ACL review required for %',f.oid::regprocedure;
   END IF;
  END IF;
 END LOOP;
END $functions$;
COMMIT;
