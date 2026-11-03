# Phase 4 database recovery

## Verified account capabilities — 3 November 2026

Console: project continua/orange-bird-13151544, default production br-noisy-block-b4z5yxup, AWS Ohio, PostgreSQL18, Free, three branches. Overview reported six-hour history, 208.1MB storage, 6.87MB history, 7.01 CU-hours and 1.06GB transfer since November1 at the observation. Billing showed 1GB/project storage, 100 compute hours, autoscale2CU and ten branches. Backup & Restore showed a six-hour selectable window, Restore/Preview controls, no snapshots and no schedule; scheduled snapshots offered an upgrade. Controls establish available UI, not a successfully exercised production restore or every role's authority.

Current [Neon pricing](https://neon.com/pricing) specifies up to six hours OR 1GB of changes, one snapshot and 5GB monthly project transfer for Free. The exact usable history can shrink with changes. No plan, history, snapshot, role, branch or backup setting was changed. No production-derived data was copied. Current recovery permissions must be rechecked by the operator before any future restore.

## Synthetic rehearsal

Run `node infra/security/phase2-postgres-fixture.mjs --phase3 --phase4` with Docker available. The harness starts/removes only its own labelled, loopback PostgreSQL17.11 container and rejects unrelated databases. Phase3 payment concurrency/crash/idempotency checks execute first. A custom-format pg_dump is restored into a new fixed-name database. Digests compare application users, synthetic subject mapping, profiles, portfolios, watchlists, financial orders, operational receipts/leases, checkpoints/evidence, constraints, RLS flags, policies and role grants. A permitted owner sees only its mapping and anon lacks operations access. New source writes after the dump remain in source and are absent from the old restored snapshot, demonstrating why it must not overwrite production. R2 references are checked against a synthetic object manifest, including a missing-object failure case.

The expanded rehearsal passed eight restore checks in about5.08s, plus54 Phase3 and311 Phase2 checks. This is not a full production-schema rehearsal, cross-cluster role export, PostgreSQL18/provider PITR rehearsal, managed Auth service configuration restore, real R2 recovery or achieved production RTO/RPO. Existing cluster roles are retained; an independent cluster also requires reviewed role/global/extension ownership reconstruction. Database name is intentionally normalized in table_catalog comparisons; grant semantics are compared unchanged.

## Recovery objectives and approval gates

Proposed RPO <=15min and RTO <=60min inside an available tested history window. Neither is achieved or promised. An existing six-hour external health check can detect an incident too late for a six-hour restore window; this is an open E09 risk. An approved shorter detection cadence and/or independent encrypted backup policy is required before declaring recovery readiness. No new high-frequency schedule was enabled.

Before a production-derived rehearsal, obtain explicit approval naming source project/branch, isolated destination, authorized operators, encrypted storage, retention/deletion and secret handling. Capture schema/global roles/policies/functions/extensions, current flags/issuer mapping, payment original-reference inventory, collector checkpoint/version hashes and private R2 manifests. Never put passwords/session cookies or dumps in GitHub logs/artifacts. pg_dump does not back up provider config, Google callbacks, SMTP settings, R2 objects or external Paystack truth.

Restore into an isolated destination first. Verify constraints/ACLs/owner and cross-user access, issuer/subject mapping and server revocation, paid entitlements/expiry, unique payment transaction receipts and original references, job leases, complete historical hashes and object availability. Reconcile writes since recovery point from the authoritative current database/provider before approving any cutover. Use a fresh app/session read; never reset accounts or resend charges. Preserve original branch and evidence. Restoring an old snapshot over live production is not authorized.
