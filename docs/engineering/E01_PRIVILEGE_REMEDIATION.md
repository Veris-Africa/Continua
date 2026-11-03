# E01 — separately gated profile privilege remediation

Prepared 2 November 2026. **Open: production privileges are unchanged.** This is a separate security release, not a hidden schema step in the bandwidth deployment.

## Evidence and scope

The audit's bounded live catalog query confirmed direct TRUNCATE, TRIGGER and REFERENCES grants on `public.profiles` for both `anon` and `authenticated`. The source grant snapshot additionally included MAINTAIN. The browser gateway accepts only statically compiled resource operations and named RPCs, not arbitrary SQL; a remotely exploitable TRUNCATE path has not been demonstrated. Excess role authority remains unnecessary.

Only the profile administrative grants are removed. Other broad table grants remain separate findings/scope; this is not an assertion that every application ACL is least-privilege after E01.

| Principal / operation | Required profile authority | E01 result |
|---|---|---|
| Anonymous browser | Existing approved public column reads subject to existing RLS/view behavior | Retain current SELECT/DML snapshot; administrative authority removed. Existing anon DML is not newly endorsed or expanded. |
| Authenticated owner | Existing column SELECT/UPDATE, permitted INSERT/DELETE, RLS owner conditions and live session guard | Unchanged; no new column or table-wide UPDATE grant |
| Other authenticated owner | No access to another owner's private mutations | Existing RLS/ownership retained; denial fixture passes |
| Provisioning owner/definer | Canonical identity/provider link/profile creation | Owner/definer execution unchanged |
| Billing service / definer | Validated order, row locks, paid-tier/expiry update and idempotent receipt | Existing service ACL and function execution unchanged |
| Existing profile triggers | Execute existing trigger logic on allowed DML | Trigger existence/owner/function behavior unchanged; browser does not need CREATE TRIGGER authority |
| Browser administrative work | TRUNCATE, CREATE TRIGGER, REFERENCES for new foreign keys, MAINTAIN | None required; all four removed from both roles |
| Operator / database owner | Approved migrations and maintenance | No owner/service grants or memberships changed |

## Files and release mechanics

- `infra/neon/security/e01-preflight.sql`: bounded read-only version/role/effective-privilege/table ACL/column ACL/inheritance inventory. Store its result securely as the exact before-state; it contains no customer rows.
- `infra/neon/security/e01-profile-administrative-privileges.sql`: explicit transaction, three-second lock timeout, ten-second statement timeout, qualified `public.profiles`, narrow four-privilege REVOKE from the two named roles, RESTRICT rather than CASCADE. An assertion verifies effective table-level administrative privileges are absent; a remaining inherited privilege fails/rolls back the transaction.
- `infra/neon/application-grants.sql`: future bootstrap snapshot no longer grants these administrative privileges on profiles. Existing DML and per-column grants remain unchanged. This edit alone does **not** revoke any live grant and must not be applied wholesale to production as a shortcut.
- `infra/security/e01-profile-privileges-fixture.mjs`: disposable in-process PostgreSQL actual-role test; accepts no external database URL.
- Native candidate CI adds the pinned local PostgreSQL fixture step. It never executes the migration against Neon.

The SQL targets PostgreSQL 17+ syntax; the read-only production check reports PostgreSQL 18.6. [PostgreSQL REVOKE documentation](https://www.postgresql.org/docs/current/sql-revoke.html) describes the separate privilege classes and RESTRICT/CASCADE semantics. Effective privileges may originate in inherited roles, PUBLIC or column ACLs: preflight must examine these rather than assuming a direct REVOKE solves every authority path. The verified baseline contained direct table grants; unexpected inheritance or column REFERENCES requires review before proceeding. Do not widen this migration automatically.

## Executed fixture — 27 checks passed

The fixture recreates the pre-remediation administrative grants on synthetic profiles, proves TRUNCATE was initially granted, applies the actual remediation twice, and checks all eight role/privilege pairs. It switches actual PostgreSQL roles and supplies synthetic owner claims rather than mocking an ACL response.

It executes unauthorized TRUNCATE and CREATE TRIGGER attempts for both browser roles. To test REFERENCES independently of schema permissions, it grants CREATE only in an isolated attack-fixture schema, then verifies a foreign-key attempt is denied. MAINTAIN absence is checked through PostgreSQL effective privileges; no production maintenance is run.

Legitimate owner full-name editing succeeds; another owner's update affects zero rows and their private row remains hidden. Paid-tier editing is denied by the normal column ACL, and the actual `billing-owner-guard.sql` trigger also denies it after a deliberately expanded **fixture-only** column grant. Browsers cannot invoke the fulfillment function.

The actual `auth-profile-metadata.sql` provisioning trigger creates synthetic canonical identity/provider-link/profile rows. The actual Paystack migration/function is loaded with its existing identity FK retargeted to `app_identity.users`, matching the target identity contract; only external pg_cron registration is excluded. Actual service-role synthetic fulfillment succeeds, repeated fulfillment returns the same receipt, and expired entitlement resolves to Free. This is database compatibility testing, not an actual Google/Neon sign-in or Paystack verification/charge. Runtime managed provider continuity still needs the designated staging smoke test.

The fixture uses simplified surrounding profile policies/tables for isolation and actual application trigger/function SQL; it is not a complete restored production schema. Production ACL/ownership variations remain preflight gates. No customer identity or linked record is touched.

## Approval and verification sequence

1. Review this security diff independently; review fixture and current full staging role-context results. Retain a restricted copy of exact preflight ACLs and owners.
2. Obtain explicit approval identifying project `orange-bird-13151544`, branch `br-noisy-block-b4z5yxup`, database `neondb`, the two browser roles and **only** `public.profiles` administrative REVOKEs. General bandwidth release approval is insufficient.
3. Check provider/branch/database/TLS pin and effective role memberships; ensure production PostgreSQL version and owners match reviewed assumptions. Abort on drift, dependent grants or unexpected column privileges. Do not expand scope or use CASCADE.
4. Apply the separate SQL once in an explicit controlled operator operation, outside startup/collector/migration automation. Capture successful commit and repeat the read-only effective-privilege inventory.
5. Verify designated synthetic owner profile edit, cross-owner denial, existing provisioning/trigger contract and synthetic/test billing compatibility. No real payment, password reset, replacement account or production record deletion is authorized by this plan.
6. Confirm table/column DML grants, RLS policies, trigger definitions and service/owner ACLs match their before-state except the intended four privilege classes. Keep E01 open until this evidence exists.

Rollback is described in [the rollback plan](PHASE1_ROLLBACK_PLAN.md). Revoke does not delete rows, drop triggers or change existing foreign keys. Never restore GRANT ALL as a precaution. Re-granting any specific former administrative privilege would require separate security approval and demonstrated necessity.
