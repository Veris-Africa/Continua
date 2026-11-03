# Phase 7 bundle optimisation

## Changes

index.html now has small public critical geometry. bootstrap.js starts one shared owned verification and requested-route code before dynamically importing main.tsx. MainLayout is lazy; report host remains thin and loads report dialog only on intent. Code-only intent prefetch remains capped at two distinct routes and stops on hidden/save-data/2G conditions. It makes no speculative private data call.

Sonner now uses the existing ThemeProvider. Both actually consumed notification systems remain. Removed only next-themes dependency; lock comparison showed no retained version/resolution/integrity changes. npm ci --ignore-scripts completed successfully. Six unreachable views removed after documented audit; they were not shipped before, so their removal is not credited as runtime byte savings.

## Measurements

Baseline main474.90 kB /gzip151.66; intermediate main471.52/gzip150.50. Final bootstrap entry29907 bytes/gzip11512 and main254.38 kB/gzip80.99. Shared dependencies and route chunks are additional: split main size is not total initial transfer. Final215 artifact files passed browser credential audit. Baseline Vite11.17sec vs final7.74sec are individual local runs. See performance reports for comparable intermediate transfer/blocking results and missing final throttled timing.

## Background work

Public cache persistence only reacts to successful public-data updates/removal; private query churn does not serialize it. Quote polling/WebSocket subscriptions pause while hidden; no alert watcher interval without active symbols. Private query caches remain memory-only and owner keyed. Cancellation reaches historical requests. Inventory retains22 timer/polling/registration sites; each is not automatically dead code. No unverified broad dependency or provider removal.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
