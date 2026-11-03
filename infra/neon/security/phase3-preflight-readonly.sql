-- Read-only preflight. Target must be reviewed as project orange-bird-13151544,
-- production branch br-noisy-block-b4z5yxup, database neondb. No migrations run here.
BEGIN READ ONLY;
SET LOCAL statement_timeout='3s';
SELECT current_database(),current_user,now() AS observed_at;
SELECT n.nspname,c.relname,c.relowner::regrole,c.relrowsecurity,c.relacl
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='operations' ORDER BY c.relname;
SELECT p.oid::regprocedure,p.prosecdef,p.proconfig,p.proacl
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname IN ('fulfill_paystack_live_order','effective_subscription_plan');
SELECT table_name,column_name,data_type FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('paystack_live_orders','paystack_native_attempts','paystack_card_renewals')
 ORDER BY table_name,ordinal_position;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public'
 AND tablename IN ('paystack_native_attempts','paystack_card_renewals') ORDER BY indexname;
SELECT status,count(*) AS count FROM public.paystack_live_orders GROUP BY status;
SELECT mode,state,count(*) AS count FROM public.paystack_native_attempts GROUP BY mode,state;
SELECT status,count(*) AS count FROM scraping.document_jobs GROUP BY status;
COMMIT;
