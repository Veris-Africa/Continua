# Phase 7 root-cause analysis

| Symptom | Verified cause / evidence | Fix and files | Limits / impact |
|---|---|---|---|
| Repeated reconnect failures | Expired session reads could repeatedly retry provider errors; transient expiry emitted logout semantics | identityClient.js cooldown/shared refresh; useAuth.tsx unavailable/recovery handling; sessionWarmup.js shared bootstrap | No insecure cached authorization; actual owner/revocation still clears private state |
| Blank/slow startup | Main React route/CSS and session restoration were serial; initial root was empty | index.html, bootstrap.js, main.tsx, App.tsx, routePrefetch.ts, WorkspaceSkeleton.tsx | Public geometry is not useful account data; final mobile target unresolved |
| Slow profile | usePosts loaded full timeline even when profile needed action handlers; profile posts enriched with repeated reads | UserProfile.tsx action-only hook and author-scoped communityFeed.js query | Selected secondary tabs still legacy; one aggregated initial post read replaces 1+6N request pattern |
| Follow flicker/duplicate action | Mounted consumers shared acknowledged query but lacked shared in-flight intent | followMutationState.js, useFollows.tsx, HubPostCard.tsx and pages | Unknown remains unknown; no speculative success/count increment |
| Missing price chart | Strict full-window coverage rejected genuine partial closes; production canonical SCOM latest Sep12, retained observed-close table absent | priceHistory.ts partial disclosure; observedHistory.js cancellation; PriceHistoryStatus.jsx | Cannot create licensed current history; 1D unavailable without intraday evidence |
| Missing/misleading portfolio chart | Today's holdings do not establish past ownership; production snapshot table empty | portfolioHistory.js backend bounded read; usePortfolioHistory.tsx, recordedPortfolioHistory.js, both chart components | Empty production history stays explicitly empty; no cost/value fabrication |
| Apparent stopped scraper | A successful document workflow actually budget-paused; news still running; processed evidence is not published canonical data | run_health.py outcome summary integrated into scheduled_collect.py | No allowance increase, lease reset or job activation |
| Unsupported financial claims | Home used seeded target/growth/yield values and Tomorrow/Fri earnings labels | CommandCenterSections.tsx replaced with research navigation; Home quote union reduced | Other issuer metadata still needs source ownership review; not a new recommendation engine |

## Bounded production evidence

Read-only transactions on confirmed production Neon branch br-noisy-block-b4z5yxup / neondb / ep-nameless-voice-b4ygobrp used 5-second statement timeout and rollback. SCOM latest eight canonical candle dates ended 2026-09-12, source_url NULL. market.observed_daily_closes was absent. authenticated role could SELECT public.portfolio_snapshots, whose bounded first-1000-row probe was empty. SCOM processed research included financials publisher_observation Nov3 02:41 UTC and history Oct23 19:34 UTC. These establish ingestion activity and gaps, not complete fresh fundamentals.

## Unresolved hypotheses

Render cold sleep, a particular managed-provider outage and owner-device network conditions may contribute to 12–14-second startup, but were not proved by forcing production restarts or manufacturing outages. No exact incident trace establishes one universal infrastructure cause. Tests reproduce application failure modes in isolation; final field error rates remain unmeasured.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
