# Phase 7 visual refinement

## Scope and diagnosis

The owner supplied six viewable attachments. Skeleton and Home are the first and second images respectively; the remaining images show modular surfaces and editorial illustration directions. These were reviewed as references, not reused as assets.

Repeated Home rules came from both explicit section borders and the blanket .app-shell .home-flow > div rule in brand-system.css. The old skeleton visibly printed a route label and repeated generic bordered three-bar groups. Both were verified in source and a local baseline screenshot.

## Implemented

- Replaced the visible route title with accessible-only status and layout geometry. Home skeleton mirrors its compact header, valuation, open chart space, three metrics and market/watch regions. Other routes receive appropriate rows/profile shapes. Reduced motion and real route navigation remain.
- Removed blanket Home dividers plus redundant chart/engine/index-section outer rules. Kept subtle metric inset separators, navigation and relevant financial-table boundaries.
- Extended the existing design tokens with selective opt-in soft surfaces. Market overview is grouped once; research shortcuts, selected market tools and a compact portfolio insight use the same language.
- Added original static editorial scenes to genuine empty states, Learn and the public resources section. Errors stay explicit, without an illustration.
- Avoided presenting unpriced holdings as an empty portfolio and guarded watchlist error presentation before its empty-state artwork. Existing financial values and feature hierarchy remain.

## Core changed files

Home.tsx, WorkspaceSkeleton.tsx, index.html, index.css, styles/brand-system.css, Market/StockDetail/TrackInvestments/Learn/Watchlist/TradersHub/Landing pages, landing.css, PortfolioPulse.tsx, EditorialIllustration.jsx and three public/illustrations SVGs. Chart behavior is documented separately in PHASE7_CHART_DIAGNOSIS.md and PHASE7_PORTFOLIO_HISTORY_FIX.md.

## Review evidence

Screenshots under screenshots/phase7-addendum-* are actual local production builds with explicitly synthetic accounts and financial values. They do not prove missing production history has been created. Before/after mobile and desktop, route loading, error/retry recovery and original art placements are included where captured. Final tested dimensions, theme checks and metrics are in PHASE7_VISUAL_PERFORMANCE_RESULTS.md.

## Limits and rollout

No production push/deploy or schema/job/configuration change. The original upstream chart HTTP failure is not conclusively identified; the broken retry pointer handler is independently reproduced and fixed. Missing published stock dates and empty snapshot storage remain production-data boundaries. Existing unrelated Learn progress/course placeholders were not certified by this visual work.

Review the exact local commit, normal CI/security/build results and screenshots before approving deployment. Rollback restores baseline3a78c6a frontend/backend through normal reviewed revisions, preserving customer data and provider settings. No source-rights bypass, password changes or destructive data rollback.
