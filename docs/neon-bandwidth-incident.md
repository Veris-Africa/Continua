# Neon bandwidth incident — investigation, 1–2 November 2026

## Status and safety boundary

Local remediation branch: `codex/neon-bandwidth-efficiency`, based on deployed
`8a5b3509d353d06f1b1cc82218dee57bfccfc885`. No production deployment, environment
change, schedule toggle, migration, identity change, deletion or paid upgrade was
performed during this investigation. Existing schedules were already active.
Implementation and offline validation do not constitute production verification.

Project `continua` / `orange-bird-13151544`, production branch
`br-noisy-block-b4z5yxup`, database `neondb`, AWS Ohio remain the target.
The Node compatibility backend remains deployed; this is not the Go cutover.

## Evidence timeline

| Time | Evidence | Interpretation |
|---|---|---|
| 26 Oct ~09:10 EAT | User-reported dashboard: 4.29 GB, 86.7%; storage 203.19 MB; compute 13.7 CU-hours | Historical observation, not a per-service breakdown |
| 26 Oct ~16:12 EAT | User-reported monthly transfer exhausted banner | Provider restriction; storage size does not measure egress |
| 27 Oct 23:58–23:59 UTC | Collector run `40605703165`, job `122544536170`: explicit Neon quota-exceeded connection error, then pool timeout | Confirmed provider quota failure; IPv6 network-unreachable messages are secondary |
| 28 Oct 05:29–05:30 UTC | Reconciliation run `40638317740`, job `122650359311`: same explicit quota failure | Not evidence of a SQL syntax or credential defect |
| 1 Nov 16:33–16:42 UTC | Pre-investigation manual reconciliation `41326970165`, job `124908846250`: 305 archive records, zero newly processed research, checkpointed, no failures, 515.636 seconds | Backlog progressed but redundant context reads occurred despite no new processing |
| 1 Nov 16:37–16:43 UTC | Pre-investigation manual collector `41327275187` succeeded; manual health run also succeeded | Access had recovered; no runs were dispatched by this investigation |
| 1 Nov 16:58 UTC | One successful bounded read-only SQL connection; `pg_stat_statements` absent. Backend live/HTML/anonymous session envelope HTTP 200 | SQL available; these checks do not prove a signed-in user flow |
| 1 Nov dashboard | Since Nov 1: 230.27 MB transfer, 204.83 MB storage, 1.75 CU-hours | Monthly period reset; no current quota banner |
| 1 Nov 17:12 UTC | One bounded SQL aggregate: 147 context input rows, 539,828 original JSON bytes, 495,357 projected JSON bytes | Server JSON-text sizes only; returned aggregate, not records |
| 2 Nov ~14:36 UTC / 17:36 EAT | Dashboard: 662.56 MB transfer, 206.14 MB storage, 4.57 CU-hours since Nov 1 | About 432.29 MB additional usage between dashboard observations, while production still runs old code; not attributed to a single service |
| 2 Nov Render read-only configuration | Live `8a5b350`; `CACHE_DRIVER=memory`, `PROCESSED_STORAGE_READS=prefer-r2`, workers enabled; price poll 30 seconds, index poll 30 minutes | Upstash is not the effective shared API cache |
| 2 Nov 14:50:59 UTC / 17:50:59 EAT | Bounded follow-up deep health HTTP 200 in 1,308 ms; database/cache/quote freshness all true | Render currently reaches Neon. An earlier 30-second request timed out; cold start is plausible but not proven |

The gap in scheduled run history between late October and Nov 1 does not establish
why schedules stopped. At triage all eight workflows were active; both scheduled
collector flags were `true`. Their states were left unchanged. The next quota
reset reported by Neon was December 1 UTC. Diagnostic receipts are ignored local
artifacts under `.qa-artifacts/neon-bandwidth-20261101/`.

## Ranked findings: facts versus attribution

1. **Verified recurring amplification:** `ResearchProcessor.run()` refreshed every
   issuer context even for an empty processing batch. Reconciliation invokes it
   again after each five-record archive batch because new pointers may unblock
   evidence. A 305-record archive therefore requires at least 61 such passes before
   its time limit. Each pass selected full context payload JSON. The offline
   complete-drain fixture has 62 passes; the fix has one context refresh. This is
   a proven avoidable transfer pattern, not proof that it caused all October GB.
2. **Verified duplicate public payload path:** collected-research reads selected
   `p.payload` even with a verified current R2 pointer, then discarded it and read
   the R2 object. The fix suppresses only that discarded SQL result. Rights and
   pointer revision checks remain on every request.
3. **Verified cache configuration gap:** Render uses process-local memory, not
   Upstash. Restarts/spin-down and multiple processes lose/share no public cache.
   The exact additional Neon bytes from misses were not recorded historically.
   No cache credentials were exposed or configured in this task.
4. **Verified duplicate analytical reads:** SMA, RSI and MACD in one Engine bundle
   independently requested the same full candle window. Job-scoped reuse now
   performs one repository read with numerically identical results.
5. **Verified frontend duplication:** StockDetail warmed annual limits 10 and 20;
   detail components requested both under distinct query keys. They now share
   a covering window, keeping complete larger explicit requests and per-view slices.
6. **Verified failure amplification, smaller payload impact:** Python pool workers
   repeatedly attempted connections after quota rejection. Job startup now makes
   one explicit connection attempt before starting the pool. This reduces failed
   job noise and connection attempts; it is not claimed to explain gigabytes.
7. **Verified recurring maintenance overhead:** routine collection/reconciliation
   replayed additive schema DDL. Normal runs now validate checkpoints; schema
   setup is an explicit maintenance action. Collector processing also moves behind
   its reservation/lock, so skipped runs do not process evidence first.

### One-time traffic and remaining uncertainty

Migration exports, comparisons, snapshots and first-time immutable R2 archive
creation can transfer database records. The successful Nov 1 run's 305 new archive
receipts demonstrate backlog work. Archive snapshot compression means its
`downloadBytes=856568` and `uploadBytes=856568` are source/R2 logical counters,
**not Neon egress**. Do not subtract these from billed transfer or infer that
database snapshots cost less than a megabyte. Archived receipt versions resume
incrementally; this change does not re-export them.

No scheduled workflow invokes the one-time Supabase-to-Neon import/export or
comparison operators. Their ignored historical artifacts were not executed.
Full raw migration is a distinct explicit CLI mode, absent from normal cron.
Migration/backfill work may have contributed to October consumption, but there
is no historical per-query byte ledger that can apportion the 5 GB reliably.

Neither high query time, returned row count, index size, database storage nor CPU
usage establishes exact network bytes. No `EXPLAIN ANALYZE`, large record export,
extension installation or repeated failed connection diagnostics were performed.
No speculative index was added: the confirmed transfer waste is redundant reads
and discarded columns; an index alone cannot fix their output volume.

## Authentication, availability and risk

Render configuration confirms `AUTH_PROVIDER=neon-managed`, production enabled,
branch `br-noisy-block-b4z5yxup`, and the pinned
`ep-nameless-voice-b4ygobrp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth` service.
Runtime guards bind that Auth issuer to the approved database host/branch. The
anonymous envelope passed; a fresh authenticated login was not performed in this
incident check. Live revocation, owner mapping, subscription checks and payments
are unchanged. Auth database reads are security-relevant, not bulk financial
transfers; do not cache settled authorization to hide an outage.

The database accepted the bounded probe on Nov 1 and Render's deep health passed
on Nov 2. Render is live, but its Free
instance can spin down; the dashboard explicitly warns of 50+ second wake-up.
That latency is separate from SQL bandwidth. Production readiness after this patch
still requires an approved deploy and observed authenticated/application checks.

The current Free plan includes 5 GB public network transfer per project/month
([official Neon plans](https://neon.com/docs/introduction/plans), checked Nov 1).
662.56 MB by Nov 2 does not demonstrate sustainable Free usage. Optimisation
must be measured for a representative 24–72 hours before claiming a monthly fit.
No upgrade, new project or allowance workaround is proposed as the fix.

See [optimisation](neon-bandwidth-optimisation.md) for scope/measurements and
[operations](neon-bandwidth-operations.md) for deployment, approval and rollback.
