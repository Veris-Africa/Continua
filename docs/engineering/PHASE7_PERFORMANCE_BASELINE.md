# Phase 7 performance baseline

Baseline: Phase 6 build, local production bundle, synthetic empty signed-in account, identity latency fixed at 2000 ms, no external data forwarding, uncompressed loopback assets. Lighthouse 13.6.0 results were gathered before the owner's sandbox-only review instruction. They are diagnostic lab values, not field p75 or owner handset measurements.

| Device | FCP ms | LCP ms | TBT ms | CLS | Transfer bytes |
|---|---:|---:|---:|---:|---:|
| Simulated mobile | 1667.004 | 8813.275 | 1112.751 | 0 | 1169006 |
| Desktop | 382.206 | 1925.029 | 84 | 0.0000147 | 1169006 |

Mobile warning: tested CPU slower than Lighthouse expected. Baseline main chunk 474.90 kB / gzip 151.66 kB; Vite build 11.17 seconds. Local artifacts phase7-before-mobile.json and phase7-before-desktop.json are intentionally ignored and contain synthetic diagnostics.

## Missing measurements

Production cold-versus-warm Render timing, field INP, React commit durations, browser cache hit ratios, exact useful-account-content timestamp, and production SQL/billed-transfer deltas have no controlled baseline. Do not substitute paint, visible skeleton, chunk size or request-count calculations for those metrics.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
