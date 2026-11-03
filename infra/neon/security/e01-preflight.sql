-- Read-only operator inventory before a separately approved E01 change.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '3s';
SELECT current_database(), current_user, current_setting('server_version');
SELECT r.rolname, r.rolsuper, r.rolbypassrls
FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role','neondb_owner');
SELECT r.rolname, p.privilege,
  has_table_privilege(r.rolname,'public.profiles',p.privilege) AS effective
FROM pg_roles r CROSS JOIN (VALUES ('TRUNCATE'),('TRIGGER'),('REFERENCES'),('MAINTAIN')) p(privilege)
WHERE r.rolname IN ('anon','authenticated') ORDER BY r.rolname,p.privilege;
SELECT c.relowner::regrole AS owner, c.relrowsecurity, c.relforcerowsecurity, c.relacl
FROM pg_class c WHERE c.oid='public.profiles'::regclass;
SELECT a.attname,a.attacl FROM pg_attribute a
WHERE a.attrelid='public.profiles'::regclass AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL;
SELECT member::regrole AS member,roleid::regrole AS parent
FROM pg_auth_members WHERE member IN (SELECT oid FROM pg_roles WHERE rolname IN ('anon','authenticated'));
COMMIT;
