# Phase 7 chart reliability

## Stock prices

priceHistory.ts retains genuine normalized closes, deduplicated chronologically. Two or more real observations can display with explicit partial date coverage instead of being suppressed solely for not spanning a whole selected window. Large unexplained gaps remain unavailable for restricted windows. Close-only data cannot become OHLC. 1D cannot be invented from a current quote. observedHistory.js/historicalApi.ts/useHistoricalCandles.tsx forward cancellation; source outages remain distinct from successful empty/404 compatibility responses. StockDetail and PriceHistoryStatus show pending/error/retry/missing separately. Existing public cache behavior is preserved.

Sandbox KCB: 1D unavailable; 1W rendered 8 synthetic dated observations with explicit Oct27–Nov3 coverage. Tests cover partial windows, missing OHLC, gaps, finite/date normalization and source 503 versus empty. Production SCOM canonical data is old and observed-close retention absent; this implementation does not fix missing source observations.

## Portfolio history

Today's holdings cannot prove historical ownership. Replaced current-basket backcast with a dedicated owner-scoped SELECT of recorded public.portfolio_snapshots. Dates and row count are bounded; duplicate-day corrections choose newest created_at/id; over 1000 rows fail explicitly instead of truncating. Existing JWT/session guard, authenticated role and RLS remain. Browser accepts only recorded_portfolio_snapshot basis, real finite nonnegative values/costs, valid dates and no contradictory duplicates; no generated dates, prices or endpoint appended. Chart percentages use recorded cost, not current cost, and do not claim cash-flow-adjusted return.

Sandbox Home and Portfolio rendered eight fixture snapshots, latest 314 vs current total500 without merging the quote into history. 1D showed insufficient observations. Real PostgreSQL disposable fixture passed owner separation, revocation, correction ordering, transaction role cleanup and numeric chart parity. New private route unit tests passed. Production snapshot table is empty, so real users will see honest missing history until an explicitly approved recorder/backfill exists. Never backfill from current holdings.

## Impact / rollout

One bounded owner/date SQL read replaces two market-history source requests per current holding. No production rows were created. Backend must deploy first, with frontend read returning clear failure if unavailable; no generic table access expansion. Retention SQL and any snapshot recorder are separate gated releases.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
