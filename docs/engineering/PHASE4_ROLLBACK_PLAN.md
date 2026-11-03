# Phase 4 rollback and migration plan

Application rollback never restores customer tables. Preserve every legitimate post-release write, payment receipt/reference, identity mapping, financial version, collector checkpoint and R2 object.

| Failure | Safe rollback / repair | Verification and data protection |
| --- | --- | --- |
| Frontend/rendering | Select last known-good Cloudflare Worker+Assets version with recorded source SHA; no force push | Auth, route navigation, revision, owner portfolio/watchlist and stock tables; HTML/assets must be coordinated |
| Worker/API proxy | Restore known-good Worker version and reviewed bindings/flags; do not copy secrets into manifest | Managed cookies/origins/rate controls, private endpoints blocked, upstream SHA; no public cache of private reads |
| Backend | Use retained Render artifact matching reviewed source; Phase3 baseline4e35bf9 or security-fixed66de6e4 preferred | Health revision, existing schema contract, owner/plan reads, signed webhook compatibility; no charge as smoke test |
| Configuration | Review before/after non-secret flag/issuer/branch/cadence inventory; restore exact compatible values through approved provider change | Render rollback may reuse target deploy env and shared-group behavior differs; verify effective state instead of assuming all current settings survived |
| Browser telemetry | Turn off both reviewed frontend and Worker collection flags in approved change or roll back code | No event requests/logs; no queued retry backlog to purge |
| Runtime telemetry | Roll back instrumentation code independently, retain existing pressure/query logs | Original app/cache/auth semantics; no SQL reversal needed |
| Database migration | Abort bounded transaction before commit; after commit choose forward repair against captured DDL/ACL | Never blanket GRANT ALL, DROP/CASCADE or snapshot overwrite; separately approved inverse only after writes/receipts reconciled |
| Activated payment durability | Follow Phase3 rollback, account for all ACKed unresolved work first, disable only with approval | Retain operations tables; do not clear unknown active_reference or repeat charge POST; provider may not redeliver acknowledged events |
| Scheduler | Restore previously approved enabled/cadence state after proving no live lease/inflight effect | Do not reactivate paused collectors; distinguish no further admission from cancellation of an already sent charge |

Render [rollback documentation](https://render.com/docs/rollbacks) states artifact retention is plan-dependent and dashboard rollback disables auto-deploy; API rollback behaves differently. Record that configuration effect and obtain appropriate incident approval rather than silently changing it. Cloudflare Worker versions and Assets roll back together; provider/service bindings and database state require their own verification. Do not use a code revert as proof of provider setting or database recovery.

## Expand and contract

1. Capture dated source SHA, live frontend/Worker/backend revisions, schema contract, non-secret flags, current scheduler states and rollback artifact availability. Source-file hash is not an applied migration version.
2. Review bounded metadata preflight and conflict/ownership/ACL evidence for exact target; no large customer export. Obtain separately scoped production-derived staging approval if necessary.
3. Rehearse additive DDL with real schema/roles, functions/policies and old/new application versions. Test cross-user/plan boundaries, concurrent writes, idempotency, leases and post-backup writes. Capture exact prior ACL/function bodies; no generic inverse.
4. Deploy code compatible with old and new schema with feature flags off. `migration-compatibility.mjs` checks the disabled contract and inventories normalized SQL hashes; it never executes SQL and operator applied receipts are not catalog attestation.
5. Obtain exact production SQL approval; apply reviewed additive migration under bounded transaction/lock/statement limits. Record operator, source hash, commit outcome and postflight; ambiguous commit requires read-only catalog check before retry.
6. Separately approve constraint validation/feature activation after compatible rollout and observations. Never automatically activate from a present SQL file. Pending Phase2 E01/E04/hosted intents and Phase3 operations follow this process.
7. Retain old fields/objects/roles until every consumer and recovery path is verified. Contract/drop/destructive cleanup requires separate approval. Prefer forward repair where reverting schema would lose new data.

Local tests exercise drift detection, disabled migration compatibility, source inventory, synthetic old/new app tables, payment replay and post-dump writes. No live provider rollback, production snapshot restore or configuration change was executed as a test.
