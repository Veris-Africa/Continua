# Database operator and recovery boundaries

This directory contains Neon migration/import/verification tools, historical
identity adapters, source-permission readers and separately reviewed security SQL.
Presence in the repository is not approval to execute a script or apply SQL.

| Location | Role | Execution boundary |
|---|---|---|
| `supabase/migrations/` | Historical schema/policy history and restore fixtures | Keep exact filenames/content/order; not an automatic Neon migration queue |
| `backend/migration/` | Market/ingestion schema history and reference SQL | Preserve ordering and recovery consumers; no Phase 6 execution |
| `infra/neon/security/*preflight*.sql`, `e01-preflight.sql` | Explicit read-only preflight inputs | Read-only does not mean it should run automatically in production |
| `phase2-application-privileges.sql`, `phase2-watchlist-integrity.sql` | Pending privilege and integrity remediation | Separate approval and existing-data assessment required |
| `phase2-hosted-checkout-intents.sql`, `phase3-payment-operations.sql` | Pending optional payment operations | Separate SQL and activation approval; flags remain off |
| `infra/security/*fixture*`, `infra/migration/*fixture*` | Disposable SQL/restore/parity tests | Dedicated fixture databases only; never production DATABASE_URL |
| `infra/deployment/migration-compatibility.mjs` | Offline pending inventory/checksums and compatibility | Does not discover applied production state or execute SQL |

Run the offline compatibility tool to view pending filenames/hashes. The current
source inventory cannot prove that a production migration has been applied.
Phase 6 moves no SQL file and changes no schema, role, grant, policy or data.
