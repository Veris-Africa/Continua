# Phase 7 performance results

## Intermediate candidate, before final bootstrap

Same lab identity delay and device profiles as baseline.

| Device | FCP ms before / intermediate | LCP ms before / intermediate | TBT ms before / intermediate | CLS intermediate | Transfer bytes before / intermediate |
|---|---|---|---|---:|---|
| Mobile | 1667.004 / 1667.960 | 8813.275 / 8934.939 | 1112.751 / 798 | 0 | 1169006 / 1141038 |
| Desktop | 382.206 / 371.850 | 1925.029 / 1772.287 | 84 / 25 | 0 | 1169006 / 1141038 |

Mobile LCP became worse despite lower blocking and transfer: this is **not accepted as a solved startup problem**. The LCP was the first-holding empty-account content, not the boot skeleton. No statistical significance is claimed from one run per profile.

## Final bootstrap implementation

The entry is now 29907 bytes / gzip 11512 bytes; React main chunk 254.38 kB / Vite gzip 80.99 kB. These are split chunks, not total application savings. The HTML has no blocking stylesheet link; Vite loads route styles before mounting the deferred application. A shared session check begins before parsing React and is consumed once by AuthProvider. Build completed in 7.74 seconds, but build time is machine-dependent. Browser artifact audit scanned 215 files with zero findings.

Sandbox acceptance: public startup status transitioned into synthetic Home, dated recorded chart appeared, weekly stock chart displayed 8 genuine fixture observations, and deferred report form loaded. Final controlled Lighthouse/field timing is **not measured**. The sandbox read-only performance API did not expose entries; a loopback-only PerformanceObserver fixture instead emitted redacted measurements through browser console logs. No further external browser was launched. Do not compare intermediate figures to the final bundle as though they are one receipt.

## Database/network impact

Profile initial posts become one bounded aggregated HTTP read, with no background full feed. Portfolio history becomes one owner/range read rather than two history-source reads per current holding; its SQL remains session guarded and row limited. No production billed-byte reduction is measured. Public-cache persistence no longer serializes on private query/observer changes. Hidden quote polling and empty-alert timers stop.

Final mobile LCP acceptance and real slow-network/cold-backend measurements remain release follow-up requirements.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.

## Final paired sandbox measurement

After the direct read-only timing API proved unavailable, infra/performance/lab-timing.js was served only when LAB_TIMING=true. It records paint/long-task/layout-shift timings and one known synthetic Home landmark, never content, tokens or identity. LAB_DIST_DIR selects the archived baseline dist; both servers bind127.0.0.1, deny mutations and never forward requests.

The exact Phase6 app and two shared contracts were archived read-only; its former next-themes0.4.6 was installed only in the ignored baseline fixture, using the same existing React/build toolchain. Baseline built from its app working directory in11.83sec. One earlier root-directory build was stopped and is not used.

| Measurement | Phase6 baseline ms | Phase7 final ms |
|---|---:|---:|
| First contentful paint | 2404 | 172 |
| Useful synthetic Home landmark | 2543.900 | 2268.600 |
| Last observed LCP candidate | 2724 | 2472 |

Same sandbox browser, unthrottled loopback, fresh separate origins and same2000ms synthetic identity delay; one run each, not a statistically validated or throttled mobile comparison. Useful content improves about275ms; the much larger paint improvement is the public boot geometry and must not be presented as account-data readiness. Raw recorded long tasks: baseline101/57/122ms, candidate59/82ms; these are not standardized TBT. Last observed layout shift sum baseline0.00002063, candidate0. Timing receipt: PHASE7_SANDBOX_PERFORMANCE.json.
