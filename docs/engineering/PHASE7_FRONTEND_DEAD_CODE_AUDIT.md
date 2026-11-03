# Phase 7 frontend reachability and deletion ledger

Established before deletion. Tool: tools/audit-frontend.mjs. Literal static/dynamic import closure covers all 460 app/src runtime/style files and 42 routes. This is a conservative graph, not deletion permission for every unreferenced module.

| Candidate | Decision and evidence |
|---|---|
| app/src/components/shared/SplashScreen.tsx | Confirmed unused view: no incoming runtime imports, route/plugin/glob registration, test/CLI consumer or active feature flag. Historical documentation citations retain their historical meaning. Remove source only; no dependency or financial contract removal. |
| app/src/components/home/QuickTradeWidget.tsx | Confirmed unused view: no incoming runtime imports, route/plugin/glob registration, test/CLI consumer or active feature flag. Historical documentation citations retain their historical meaning. Remove source only; no dependency or financial contract removal. |
| app/src/components/home/RealtimeWatchlistWidget.tsx | Confirmed unused view: no incoming runtime imports, route/plugin/glob registration, test/CLI consumer or active feature flag. Historical documentation citations retain their historical meaning. Remove source only; no dependency or financial contract removal. |
| app/src/components/home/TopMoversLosers.tsx | Confirmed unused view: no incoming runtime imports, route/plugin/glob registration, test/CLI consumer or active feature flag. Historical documentation citations retain their historical meaning. Remove source only; no dependency or financial contract removal. |
| app/src/components/home/TrendingStocks.tsx | Confirmed unused view: no incoming runtime imports, route/plugin/glob registration, test/CLI consumer or active feature flag. Historical documentation citations retain their historical meaning. Remove source only; no dependency or financial contract removal. |
| app/src/components/home/WatchlistSummary.tsx | Confirmed unused view: no incoming runtime imports, route/plugin/glob registration, test/CLI consumer or active feature flag. Historical documentation citations retain their historical meaning. Remove source only; no dependency or financial contract removal. |

Retain type-only interfaces, API/provider transports, .d.ts contracts, UI-library primitives, financial oracles and candidate desk modules whose operational/future ownership is unverified. Zero direct imports alone is insufficient. All remaining candidates are retained and classified in the final inventory/report.

These views were already outside the reachable production graph. Their deletion is maintainability/build-input cleanup, not claimed shipped-byte or runtime savings.

Dependency ledger before removal: next-themes is used only by the Sonner adapter. App already owns its theme through components/theme/ThemeProvider; adapt that one consumer to the existing provider, retain both actually used notification systems, then remove next-themes only. Verify retained lock versions and clean installation.

Final graph: 463 source/style files, 408 reachable files, 42 routes, 55 retained candidates and 22 background/registration sites. Complete retained-candidate inventory: docs/architecture/PHASE7_FRONTEND_INVENTORY.json. These remain retained pending proven ownership; no blanket deletion.

Validation: full frontend205 tests and root build/TypeScript/43 Worker checks passed; clean install and dependency-floor passed. Removal has zero claimed shipped-byte saving because deleted modules were unreachable. Backend/CLI/reference contracts remain. Main/bundle figures are documented separately in PHASE7_BUNDLE_OPTIMISATION.md. Deployment requires explicit Phase7 commit approval; no production deletion or configuration change.
