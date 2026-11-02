# Phase 2 security results

Local validation, 2 November 2026. No Phase 2 production changes. Phase 1 release and exact live SHA are recorded in PHASE1_RELEASE_VERIFICATION_20261102.md.

## Evidence and access matrix (E01)

A safe production catalog/aggregate query found 471 table-grant entries, including 204 administrative grants to browser roles, 30 SECURITY DEFINER functions and 156 RLS policies. anon, authenticated and service_role had no LOGIN, SUPERUSER or BYPASSRLS. The database owner has BYPASSRLS and must remain a server-only connection; SET LOCAL role/claims/session guard supplies the browser boundary. Catalog counts are not customer data and do not imply that excess production grants have been fixed.

| Principal / surface | Necessary access preserved | Administrative access / checks |
| --- | --- | --- |
| anon public profile projection/community/public market receipts | Existing explicit SELECT and reviewed public RPCs; RLS determines visible rows | No browser TRUNCATE, TRIGGER, REFERENCES or MAINTAIN on 34 reviewed relations; no public-schema CREATE permitted by migration preflight |
| authenticated own profile, holdings, watchlist, preferences, alerts | Existing explicit SELECT/INSERT/UPDATE/DELETE where currently granted, owner RLS and session guard; no self-upgrade authority | Same administrative revokes; immutable owner fields on core PATCH APIs; new watchlist ownership/quota guards |
| authenticated social posts, comments, reactions, rooms, follows | Existing visibility/interaction RLS, DML and allowlisted RPCs; unique reaction contract retained | Trigger helpers need no direct browser EXECUTE; reviewed RPC EXECUTE is preserved |
| service_role provisioning/payment/jobs | Existing grants, transactional provisioning/fulfillment; fixture service role also lacks BYPASSRLS | No service grants changed; migration aborts if trigger EXECUTE loss would depend on PUBLIC |
| database owner / managed identity schema | Server-only access; managed binding and live session checks; client never selects arbitrary app_identity tables | Not a browser principal. Do not expose owner credentials or claim RLS restricts the owner |
| public-schema SECURITY DEFINER | Reviewed functions get pg_catalog,public,pg_temp path; trigger-return helpers lose direct PUBLIC/browser EXECUTE | Static signature allowlist; unrelated functions/policies left unchanged; full-schema rehearsal required |

The detailed, explicit per-object DML/EXECUTE snapshot is infra/neon/application-grants.sql. It replaces broad browser table ALL grants with their required DML equivalents while preserving service statements. It is a restore reference, not a production migration. The narrow security file also checks effective administrative privileges and aborts if inherited/PUBLIC rights remain. RLS does not protect TRUNCATE or arbitrary trigger creation.

## Validation

| Check | Result |
| --- | --- |
| Backend complete Vitest suite | 619 passed, 18 existing skips; 144 files passed, 3 skipped |
| Final browser-data transport suite after adding outage regression | 10 passed, including the additional table-route 503/Retry-After test |
| Frontend node tests | 191 passed, zero failed |
| Real local PostgreSQL 17.11 | 311 checks passed; actual prepared SQL, role/claim transactions, RLS denial, 16 default/24 quota/12 post concurrent requests, stale edit, numeric SQL parity and mocked checkout + SQL fulfillment |
| Real local Redis | 10 checks passed, 30 concurrent increments over two independent connections, restart persistence, TTL and fail-closed outage; no Upstash calls |
| Canonical financial fixture | 99 passed; 6 synthetic companies; no production processing |
| Native company bundle parity | 6 passed; no native cutover |
| Backend typecheck and build | Passed; JS service build, no new TypeScript backend runtime |
| Root production build / Worker tests | Passed; 40 Worker tests; browser artifact secret scan zero findings; managed issuer pin passed |
| Route inventory / whitespace checks | Generated route inventory check and git diff --check passed |
| AI adversarial tests | Offline schema/citation/context/activation tests passed in backend suite; no model, tools, payment or key provisioning |

Initial reruns exposed local sandbox port restrictions and Python missing from PATH. Re-runs used loopback fixture access and the installed Python interpreter and passed. A PostgreSQL startup race was fixed by waiting for its final TCP server before opening the pool. These were test-environment failures, not evidence of a production outage. Logs remain ignored under .qa-artifacts and are not release artifacts.

Same-user, cross-user, Free/Premium/Plus, invalid/revoked sessions and provider failure coverage includes existing engineAccess, institutionalAccess, engineNotebookAccess, neonEngineIdentity, managedAuth, managedRoutes and identityClient suites plus new authDependencyFailures/phase2AssistantSafety and real-role SQL checks. Managed registration/login/logout/recovery are mock-backed locally. The only live account smoke was the owner's existing signed-in read-only pages; no production signup/reset test was performed.

## Remaining concerns / gates

- E01 excess grants remain LIVE until the separately approved migration. The real-role fixture uses simplified surrounding tables, not a restore of every production SECURITY DEFINER body/RLS policy. Full-schema rehearsal and exact rollback ACL capture are required before production SQL.
- E04 direct database writers need the proposed constraints/trigger, not only the application guard. Existing conflicting data must stop deployment for manual review; no data cleanup is authorized.
- E11 intent persistence is limited to mounted clients and existing rows; it does not survive reload as a durable client receipt/tombstone. Hosted support stays disabled until DDL and compatible callers/reconciliation are approved. Retained ambiguous post uploads can leave orphans.
- E12 tests do not prove semantic grounding or universal injection resistance. Paid AI remains disabled by default; no live provider evaluation or spending was authorized.
- E15 current managed integration does not offer MFA, verified email change or recent OAuth proof. The contract reports AAL1 and unsupported controls honestly; password recovery/email verification/recent password proof are retained.
- E16 existing global NUMERIC/INT8-to-number parsers remain; arbitrary precision is not fully resolved. No zero-cost acquisition model was introduced.
- Public raw market/research APIs remain project-key public; paid Engine gates are separate. Whether additional raw datasets require a paywall needs an explicit product/source-rights decision. Per-process supplemental identity/Engine limits are not durable multi-replica limits; shared activation requires approved infrastructure.

Application changes are prepared for review. Phase 2 is NOT cleared for an automatic main push or production SQL. See deployment/rollback plans for exact gates and approval scope.
