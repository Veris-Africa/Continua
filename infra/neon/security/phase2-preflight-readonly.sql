-- READ ONLY: run immediately before an approved Phase 2 SQL release.
-- Save output privately with release SHA and branch/database identity; do not commit it.
BEGIN READ ONLY;
SET LOCAL statement_timeout='10s';
SELECT member.rolname AS member,granted.rolname AS granted_role,m.admin_option FROM pg_auth_members m JOIN pg_roles member ON member.oid=m.member JOIN pg_roles granted ON granted.oid=m.roleid WHERE member.rolname IN ('anon','authenticated','service_role');
SELECT current_database() AS database,current_user AS observer,now() AS captured_at;
SELECT c.oid::regclass::text AS relation,c.relacl,a.attname,a.attacl
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
WHERE n.nspname='public' AND c.relkind IN ('r','p','v') ORDER BY c.relname,a.attname;
SELECT p.oid::regprocedure::text AS function,p.proacl,p.proconfig,pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND (p.prosecdef OR p.proname IN ('enforce_watchlist_folder_limit','get_or_create_default_watchlist_folder'))
ORDER BY p.oid::regprocedure::text;
SELECT tgname,pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='public.watchlist_folders'::regclass AND NOT tgisinternal;
SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid IN ('public.watchlist_folders'::regclass,'public.watchlists'::regclass);
-- Exact explicit administrative grants for reviewed roles, including grant options.
-- Do not blanket GRANT ALL to roll back. Review only rows touched by the release.
SELECT format('GRANT %s ON TABLE %s TO %s%s;',x.privilege_type,c.oid::regclass,
 CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(x.grantee)) END,
 CASE WHEN x.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END) AS administrative_restore_sql
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN LATERAL aclexplode(c.relacl) x
WHERE n.nspname='public' AND x.privilege_type IN ('TRUNCATE','TRIGGER','REFERENCES','MAINTAIN')
AND x.grantee IN ('anon'::regrole,'authenticated'::regrole);
SELECT count(*) AS duplicate_default_owners FROM (SELECT user_id FROM public.watchlist_folders WHERE is_default GROUP BY user_id HAVING count(*)>1) x;
SELECT count(*) AS cross_owner_watchlists FROM public.watchlists w JOIN public.watchlist_folders f ON f.id=w.folder_id WHERE w.user_id<>f.user_id;
COMMIT;
