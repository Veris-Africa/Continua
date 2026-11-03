# Phase 3 security results

Local only, 3 November 2026. No Phase 3 production activation, DDL, real payment, account change, paid service or external collection was performed.

| Validation | Executed result |
| --- | --- |
| Backend full suite | 635 passed, 18 existing skips; includes new durable webhook, payment operations and renewal crash-boundary tests |
| Frontend suite | 191 passed; no Phase 3 frontend redesign |
| Phase 3 real PostgreSQL fixture | 54 checks passed, plus all 311 Phase 2 SQL checks in the same disposable harness |
| Collector full suite | 211 run, 6 database-fixture skips; all remaining tests passed |
| Collector real PostgreSQL harness | All 6 skipped collector tests separately passed against disposable PostgreSQL, including same-attempt expired lease rejection and restart recovery; existing Go SQL fixture also passed without a rewrite/cutover |
| Financial / Engine parity | Canonical fixture 99 and native company-bundle 6 passed |
| Build / type checks | Backend typecheck/build and root production build passed; Worker tests 41, browser artifact scan zero findings, managed issuer pin intact |
| Secrets / route inventory | Final tracked-file scan passed: 2,267 files, zero findings; generated route inventory and whitespace checks passed |

## Tested security and failure boundaries

HTTP tests use the real raw-body middleware and webhook handler: valid signatures wait for the persistence barrier, invalid/mixed-mode/oversized input never reaches storage, and database failure returns 503 rather than acknowledgement. SQL tests race 30 duplicate deliveries, six drainers and a checkout callback using actual payment verification/fulfillment SQL with mocked GET responses. The fixture forbids every real provider charge/initiation POST.

Fault injection leaves a receipt processing after verified fulfillment but before acknowledgement, expires its lease, then reconciles it without extending the paid term twice. Other tests cover reservation rollback, lost committed reservation acknowledgement, one winner across 12 independent renewal reservations, delayed/unknown/conflicting references, provider outages/pending state, retry exhaustion, 48-hour expiry, informational events not blocking reconciliation, lost webhook/callback recovery, cancellation before initiation and success followed by a failed local update. The fixed maintenance job is tested for concurrent admission, restart, lost lease acknowledgement and terminal review. These are equivalent crash-boundary injections; no production process was killed.

Anonymous/authenticated SQL roles cannot access the operations schema. Receipt tables have RLS and explicit service-only grants. The browser data compiler has no operations allowlist entry. Internal status requires the existing maintenance secret and rejects browser Origin, with no-store responses; collector recovery status uses its existing operator authentication. No customer-facing job ID or payment body endpoint was added. Existing managed session, owner/Free/Premium/Plus, source-rights, signup/logout and Phase 1/2 regressions remain in the full suite.

Financial amounts, transaction ID uniqueness, currency, owner/email/metadata verification and entitlement fulfillment still use existing Paystack services/SQL. Incoming event type alone never grants access. Refund/dispute/subscription lifecycle events are classified for review/information, not a newly invented access policy. Operational logs contain counts, categories and elapsed time, not keys, raw webhook bodies or reusable authorizations.

Initial collector execution with system Python lacked bs4/aiohttp/psycopg. The dependency-complete existing test environment passed. The older attempt-token test was updated to retain its assertions while accounting for the new bound delay parameter and live lease fence. No tests/security gates were removed.

## Remaining release risks

- Phase 2 E01 production excess grants and E04 direct-SQL constraints remain unapplied. Their reviewed production rollout/full-schema rehearsal remains separate; tests do not close live permission risk.
- The Phase 3 fixture uses simplified surrounding app tables and synthetic users. A current full-schema staging rehearsal, provider test-mode acceptance and approved configuration inspection are required before production activation.
- No production provider event replay, real charge, refund or renewal mandate was exercised. Refund/dispute/cancellation entitlement policy remains an explicit owner decision.
- Exactly-once execution, uninterrupted Render Free uptime, bounded real-provider p95 and automatic recovery after an indefinite provider/database outage are not promised. Unknown outcomes remain locked/reviewable; they do not trigger repeated charge POSTs.
- Private terminal metadata is retained; a retention policy and tested backup/restore path are release gates. No deletion/cleanup is authorized by this package.
