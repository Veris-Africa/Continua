# Phase 1 performance results

2 November 2026. All new comparisons below use synthetic, disposable local PostgreSQL or offline test doubles. No production load test, real payment or production data mutation was performed.

## Reproduce

Use the existing repository dependencies and Node 24. Install pinned PGlite into the ignored fixture directory if absent:

```powershell
npm install --prefix .qa-artifacts/canonical-fixture --no-save --package-lock=false @electric-sql/pglite@0.5.10
node infra/migration/phase1-query-parity.mjs
node infra/security/e01-profile-privileges-fixture.mjs
node infra/migration/canonical-financial-fixture.mjs
```

`phase1-query-parity.mjs` refuses external database configuration by constructing its own in-process PostgreSQL and replacing the imported pool with that database. It seeds only synthetic rows. Times below are one local run, not medians, p95, network RTT or hosted staging performance. Its immutable input includes 20 securities × 25 annual dividends, including cancellations and non-integer amounts.

| Operation | Before | After | Interpretation |
|---|---:|---:|---|
| Complete dividend retrieval calls | 20 | 1 | 95% fewer calls in this enrichment slice; not whole-portfolio query reduction |
| Dividend rows returned | 500 | 500 | Deep-equal per-security results, all 25 years retained |
| Sum of decoded JSON result bytes | 148,890 | 148,871 | Essentially unchanged data volume; benefit is fewer round trips |
| Dividend slice elapsed | 69.64 ms | 40.35 ms | Single-run in-process SQL observation; not a production speedup claim |
| Oversized browser read decoded result JSON | 6,000,177 bytes | 35 bytes | Same 4 MiB rejection contract; payload withheld in SQL |
| Oversized mutation representation | Full result transferred, then rollback | Sentinel, then rollback | Two original fixture rows remain unchanged; no replay |
| Source-policy metadata | No live check before cached bundle | One 32-character digest per call | Added security query; production CPU/latency cost not measured |
| Memory ordinary cache | 5,000 entries, no byte budget | 5,000 entries / 64 MiB serialized-value budget; 1 MiB per entry | Bounds do not include JS object overhead or simultaneous producers |

The 6 MB fixture deliberately tests a maximum permitted row count with oversized column values. It does not imply real profile records have that size. Counts/bytes come from actual SQL results, not a projection of customer data. SQL materialization still consumes PostgreSQL CPU and memory; the improvement is reduced result transfer and Node allocation.

## Seven representative flows

| Flow | Available verification | Full staged endpoint measurement |
|---|---|---|
| Home market overview | Existing market/API regression suite; prior frontend audit HTTP success | Pending disposable full-service run |
| Markets listing | Existing instrument/quote/date/source fixtures | Pending |
| Stock detail/fundamentals | 99 canonical financial fixture checks; frontend 184 tests; six company-bundle comparisons | Pending browser waterfall and endpoint timings |
| Portfolio retrieval | Verified-owner/free/Premium/Plus and missing-price regression cases | Pending isolated end-to-end session |
| Engine company research | Single-flight, dated fallback, source-policy revocation/outage, native-reference assembly parity | Pending cold/warm SQL/pool/HTTP cohort |
| Engine portfolio analytics | Complete dividend query comparison and existing risk/owner/entitlement tests | Only dividend slice measured; full flow pending |
| TradersHub feed | Existing guarded feed and first-write acknowledgement regression cases | Pending full synthetic feed/session run |

`infra/deployment/phase1-staging-baseline.mjs` prepares exactly two serial passes across these seven representative **API operations**. It accepts only a verified disposable localhost service, requires explicit fixture opt-in and synthetic credentials, performs no retries and stores no response bodies. Engine portfolio GET can record a snapshot, so a disposable database is mandatory. Never point a localhost API at production just to satisfy that guard. First-read does not prove cold cache; clear/restart the disposable process deliberately first. This script has not been represented as an executed full-service benchmark.

Capture protected query/pool/cache diagnostics before and after each isolated flow; correlate safe UUIDs with request logs for response bytes/latency/frequency. Take result deltas rather than comparing cumulative counters. Other workers and concurrent requests would contaminate query attribution; disable them only in the disposable fixture process. The current instrumentation measures total pool cost; it does not provide a per-request SQL trace. Record errors and retry counts, and retain all failed samples. Do not manufacture zeros for unavailable data or promote these fixtures to production acceptance evidence.

## Provider/job evidence

The read-only GitHub check at 16:05 UTC (19:05 EAT) found reconciliation run `41473813615`, job `125374010133`, successful at revision `ff99c35`. Its existing receipt reports: 510 archive records, zero new processed records, 44 company contexts, **one** context refresh, zero failures/retries, 514.346 seconds, and 4,193,467 source/R2 download bytes plus the same upload bytes. This was an already scheduled run; no job was dispatched during Phase 1.

Its SQL instrumentation shows a leading extraction snapshot fingerprint with 510 calls/510 rows and approximately 16,937,131 decoded result-value bytes (seven truncated samples), plus 102 calls/510 rows at approximately 516,890 bytes and a single context query at approximately 212,086 bytes. These are **estimates**, not Neon billing counters. The archive reader must preserve full unarchived extraction snapshots; it excludes already catalogued extraction IDs. This is evidence of remaining archive backlog work, not proof that every future run rereads the same 510 payloads. Corrected reports/new extraction versions must still archive. Do not remove payload columns needed to preserve evidence just to lower a metric.

Earlier failed October collector/reconciliation logs explicitly reported Neon transfer quota exhaustion followed by pool timeout. They did not establish an incorrect secret. A later success does not establish a sustainable monthly rate.

The preceding audit observed Neon monthly usage growing from 230.27 MB on 1 November to 662.56 MB on 2 November, with 206.14 MB storage and 4.57 CU-hours at the latter observation. These are historical dashboard samples, not a current steady-state daily estimate. Do not extrapolate an archive-backlog interval into a normal month. Capture fresh provider measurements after an approved deployment and compare comparable ingestion/traffic intervals.

## Executed checks

- Backend regression: **610 passed, 18 skipped**, 142 passing files. Initial restricted execution failed local HTTP/Python fixtures; rerun with normal local fixture access and the existing Python interpreter passed. A new cache-expiry test initially used an incompatible fake clock; the corrected real-clock expiry check passed.
- Frontend: **184 passed**, zero failures.
- Collector: **207 tests run, six skipped**, zero failures; includes retries, leases/checkpoints, concurrency, archive verification and outage cases.
- Canonical financial PostgreSQL fixture: **99 checks passed**.
- Phase 1 PostgreSQL fixture also executes the actual source-policy SQL, verifies a revoked source changes the digest and handles an empty registry.
- Company-bundle native/reference fixture: **six cases passed**, no production cutover.
- E01 PostgreSQL fixture: **27 checks passed**, actual roles and actual payment/provisioning SQL against synthetic records; no provider call.
- Final backend typecheck, JavaScript distribution build, frontend production build/artifact audits, health retry tests and repository secret audit passed. Review receipts alongside candidate SHA; these are not remote CI on unpushed commits.

No deployed staging seven-flow cohort, production warm/cold pool distribution, real Redis EVAL concurrency, production restore rehearsal, independent HTTP Worker SHA attestation or provider egress reduction is claimed. Those limitations keep the corresponding findings open.
