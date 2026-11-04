# Portfolio history reliability

## Pipeline audit

Current ownership is verified by the existing owned session. Current holdings and quotes feed the summary; they do not establish historical ownership. The dedicated /api/v1/data/portfolio_history route verifies access, sets the authenticated SQL role/claims, invokes continua_session_guard and reads owner-bound public.portfolio_snapshots under RLS. It is a signed-in portfolio feature, not a new paid entitlement. The table schema matches the query; bounded production sampling found zero rows. There is no basis for reconstructing earlier valuations from today's shares.

Backend selects only recorded date/value/cost, resolves same-day corrections, withholds invalid/negative values, caps responses at1000 plus sentinel and returns an explicit oversized-range error. It performs no mutation. Existing private/no-store headers remain. The addendum aligns future-date checks and SQL current-date filtering with Africa/Nairobi.

The browser uses one memory-only owner/from/to query shared by Home and Portfolio. It validates array shape and numeric values, including rejection of blank/boolean/null values masquerading as zero. Genuine zero remains valid. Cache entries are not persisted as public research, and existing owner-switch/sign-out clearing remains. Snapshot cost, not current cost, drives historical percentages; these are not cash-flow-adjusted returns.

## Verified functional defect and fix

Unconditional pointer capture on each plot container swallowed nested Retry button clicks. A real local-browser failure/recovery fixture established four failed reads, then no request on the old click handler. The corrected handler captures only a real multi-point plot and excludes buttons/links/form controls. The next clicked Retry produced a successful read and restored the series. Error/empty UI remains separate.

## Shared states

- Loading: accessible pending status; summary can remain usable.
- Failed: explicit service failure plus clickable Retry; never presented as an empty table.
- Empty: no recorded history for the selected period.
- One observation: a dated value and point with no line, return or trend implication.
- Series: only recorded points, exact count/date coverage, no fabricated endpoint.
- Long gap: explicit insufficient continuity, not a missing-data or transport-error claim.
- Background refresh failure: keep previously recorded data with an explicit failure/retry notice.

Both surfaces support1D/1W/1M/3M/1Y/ALL; Portfolio also retainsYTD. A current-day snapshot is a daily sample, not an intraday path. Home and Portfolio share the query and state contract even when current holdings are empty or differ from historic ownership.

## Files and validation

Core files: backend/src/data/portfolioHistory.js, browserDataRoutes.js, backend/src/domain/marketDate.js; app/src/hooks/usePortfolioHistory.tsx; lib/portfolioHistoryState.js, recordedPortfolioHistory.js; HomePortfolioOverview.jsx; RobinhoodPerformanceChart.tsx; shared/SingleObservation.jsx. The former Home-only coverage helper is now a compatibility adapter to the shared state, preserving its behavioral tests.

Seven backend route tests pass, including permission/timeout versus empty and Nairobi midnight. Real PostgreSQL fixture passes owner/RLS, revocation, cross-user empty, correction order and numeric parity. Frontend and actual sandbox tests cover points, successful series and retry recovery. See final validation report for counts.

## Production boundary / rollback

No production SQL, customer write, scheduled recorder or backfill was executed. A historical chart cannot be populated without genuine prior snapshots. Future capture must record known current ownership and permitted dated prices, preserve provenance and be idempotent; never backfill from current holdings. Prepare a staged recorder/provenance contract and obtain explicit production writer/schema/schedule approval separately.

Deploy the reviewed backend before its matching frontend. Roll back frontend first to3a78c6a, then backend if needed, using an approved normal deployment/revert. Preserve all recorded data and current managed Auth settings. Do not drop tables or reset identities as rollback.
