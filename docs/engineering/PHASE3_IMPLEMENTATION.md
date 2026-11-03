# Phase 3 implementation

Implemented on codex/phase3-payment-reliability from Phase 2 6fcfff1. The owner subsequently authorized the disabled application release: main 4e35bf9 was pushed and deployed on 3 November 2026. See PHASE3_RELEASE_VERIFICATION_20261103.md for exact provider revisions and the separate security follow-up. Production SQL and feature activation remain pending; no live payment configuration, real charge, workflow activation, new infrastructure or paid AI use occurred.

| Finding / component | Implemented code | Guarantee / limit |
| --- | --- | --- |
| E05 durable intake | services/paymentOperations.js; billing.routes.js; operations.payment_work | Raw HMAC first; one atomic receipt write before 200; semantic deduplication; bounded reference-only metadata; leased verification and review |
| E06 renewal recovery | workers/cardRenewalWorker.js; shared payment operations | Existing reservation and reference preserved; recovery is GET verification, never a repeated charge POST; 12 attempts/48-hour limit; review blocks automatic cycling |
| E08 operational visibility | monitoring/paymentOperationsStatus.js; internal/payment-operations | Secret-protected aggregate reads, transition-only durable alert state, payment/ingestion backlog and overdue maintenance |
| Existing maintenance | workers/durableMaintenance.js; ownedApplicationWorker.js | Fixed existing hourly task with SQL lease, fenced completion, retry budget and review state |
| Collector restart safety | documents.py; diagnostics.py; operator API | Current attempt plus unexpired lease required to complete; bounded jittered backoff; read-only due/age/exhaustion diagnostics |
| Long Engine work | Existing CalculationQueue/Python worker retained | Two calculations, bounded waiters and five-second computation deadline; no unjustified user-job API or polling layer |

One separate migration, infra/neon/security/phase3-payment-operations.sql, creates a private operations schema and three tables: payment_work, periodic_jobs and alert_state. Existing payment/order/receipt/profile/financial tables are not migrated or rewritten. Existing native attempt states and atomic fulfillment remain authoritative. This operational ledger schedules verification; it is not a second financial source of truth.

New backend setting: PAYMENT_DURABILITY_ENABLED, default **false**. All new payment intake/reconciliation/maintenance paths require explicit activation after SQL review and staging. The current legacy webhook path remains in use while false. PAYSTACK_CARD_RENEWAL_ENABLED, live/test mode, hosted-intent flag, paid-AI flag and independent scheduler settings are not enabled by this work. No new timer or queue service is added.

The existing independent application-maintenance wake-up seeds bounded recovery for old known native/hosted checkouts if their callback/webhook was lost, starts a bounded drainer and observes operational state. Successful responses do not require the best-effort task to finish: durable receipts and leases survive process loss. The scheduler must still be configured and healthy; no free sleeping process can provide an always-on execution guarantee by itself.

JavaScript orchestration plus PostgreSQL constraints/leases fits the deployed API and existing pool. The collector remains Python; Go was not rewritten or deployed. Language rationale is recorded in FEATURE_LANGUAGE_DECISIONS.json. Primary references reviewed: [Paystack webhooks](https://paystack.com/docs/payments/webhooks/), [recurring charges](https://paystack.com/docs/payments/recurring-charges/), [PostgreSQL row locking](https://www.postgresql.org/docs/17/sql-select.html), [Node timers](https://nodejs.org/api/timers.html), [Python synchronization](https://docs.python.org/3.13/library/asyncio-sync.html).

See PAYMENT_RELIABILITY for event policy and crash boundaries; BACKGROUND_JOBS for scheduling and operator actions; SECURITY_RESULTS and PERFORMANCE_RESULTS for executed tests and measured limits. No claim of exactly-once task execution is made. The target is recoverable work with idempotent business effects.
