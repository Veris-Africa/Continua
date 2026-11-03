# Phase 5 implementation candidate

Local branch: `codex/phase5-frontend-performance`, based on released main `7dfe140d009ac78db072dc7b2dc4a30c7805e12b`. Phase 5 has not been pushed or deployed.

## Phase 4 release receipt

Owner approved manual Render deployment after automatic deployment did not start. Render deployment `dep-dbks2759fdbs73c6nlk0` succeeded in 65 seconds on 3 November 2026. At 11:11:37 UTC, `verify-release.mjs` returned `ok:true`: frontend and backend both exactly `7dfe140d009ac78db072dc7b2dc4a30c7805e12b`; Worker `c32836d1-5a1c-441c-bfb8-a3d275b10f4b`; backend schema contract `existing-additive-20261102`. All GitHub checks and both Cloudflare builds passed. Previous Render artifact `dep-dbko4joae00c73fovtr0` / `66de6e460784be52964c144a29721db70e9a2fb8` remains rollback evidence.

Fresh Phase 4 validation: 646 backend passes / 18 existing skips; 194 frontend passes; 43 Worker passes; 51 monitoring/deployment tool passes; 311 Phase 2 SQL, 54 Phase 3 SQL and eight synthetic restore checks; 99 financial parity checks; six native bundle checks. SQL ran only in disposable fixtures. Live Home, Portfolio, Markets, SCOM and Engine rendered through the existing owner session. No customer writes were performed. This is a point-in-time release check, not an uptime claim.

Production restrictions remain unchanged: payment durability, hosted intents, paid AI and browser error reports remain disabled; no production SQL or environment edits, charges, new infrastructure, auth migration or schedule activation. Existing application schedules remain as previously configured.

Follow-up read of the public deployed frontend bundle confirmed browser-reporting `enabled:false` at source 7dfe140. Anonymous billing renewal returned 401/no-store, internal observability was blocked at the edge with 404/no-store, and the pinned public JWKS returned 200/one key.

## Changes

- Public-only route/session/assurance skeleton geometry, named status and reduced-motion support. Existing MFA and device-lock gates still precede private content.
- Bounded ordinary-session recovery for transient service/network errors, without treating failure as sign-out. No replay of OAuth/password-recovery exchanges or timed-out requests.
- Shared account-scoped following-ID queries and warm reuse. Full follower profiles load on demand. Unknown status remains unknown; failed mutations never claim success.
- Follow/count/list invalidation, same-account cross-tab invalidation notices without transmitting identities' profile data or credentials, and existing logout/account-query removal.
- Count-only profile reads, unknown-count placeholders, profile component keyed by viewer/target, and Likes/Bookmarks/Portfolio loading on selected tabs. Existing profile reaction/feed coupling remains until a tested independent mutation contract is available.
- Intent-triggered code prefetch, capped at two routes, suppressed on hidden tabs, save-data and 2G connections. No speculative private-data fetch.
- Home plot loaded only when coverage permits an actual chart. Number-animation code loaded only for a changing value, with exact-value fallback. Image export library loaded on export.
- Existing public research hydration preserved, financial refresh interval aligned with its 30-minute freshness window, explicit background-refresh failure text, and fresh historical queries reused instead of forced mount refetches.

## Language and references

Retain existing React TypeScript/JavaScript and CSS, existing TanStack Query, and a Node JavaScript offline fixture. No frontend rewrite or additional production runtime. Decision recorded in `FEATURE_LANGUAGE_DECISIONS.json`.

Primary references: [React Suspense](https://react.dev/reference/react/Suspense), [TanStack Query prefetching](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching), [Core Web Vitals](https://web.dev/articles/vitals). Suspense does not cover arbitrary effect fetching; session gates and data-specific state remain explicit.

## Limits and deferred work

The lab has synthetic identity/profile and empty positions/feed, not realistic market fixtures. Performance results cannot establish full-data latency, production p75, field INP, mid-range-device behavior or all cross-tab mutation races. Do not claim those gates passed. See the results and deployment plan before approval.

Profile per-post count enrichment, complete historical pagination and shared aggregation need backend contracts; do not download every user's votes to simulate an aggregate. Data dated 23 October, ingestion freshness and missing historical observations belong in the post-Phase-6 backend/data backlog. No chart formulas, filters or prices were changed.
