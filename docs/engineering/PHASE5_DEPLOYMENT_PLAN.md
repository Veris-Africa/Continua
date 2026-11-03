# Phase 5 deployment gate

Do not push Phase 5 to main or deploy it without separate owner approval. This branch contains frontend/tooling/docs only; no SQL or environment changes are required. The Phase 4 release already runs in production.

Before proposing production activation:

1. Review the exact local diff and commit; rerun frontend tests, typecheck, Worker/security build checks and artifact audits after any additional code change.
2. Complete populated synthetic browser tests: existing session, logout/login as another owner, paid/free/expired/unknown entitlement display, MFA/device lock, two-tab follow/unfollow and failure, privacy changes, profile tabs/counts, cached/stale/missing StockDetail statements, chart controls/scrub marker and gallery accessibility.
3. Repeat mobile/desktop cold/warm comparisons under the same conditions; include slow session, recovery and offline scenarios. Separate useful shell from verified data readiness. Obtain enough samples to assess variance; do not call a single lab result a percentile or field INP.
4. Confirm query/cache ownership and explicit permission revalidation; do not enable private shared caching or fetch every user's records to hide a waterfall.
5. Present before/after evidence and remaining backend/data gaps for approval. Then, and only then, push the approved exact commit and verify GitHub/Cloudflare. A frontend-only deployment should not require a backend restart; verify actual source-tree equivalence if revisions differ.

No production SQL, payment durability, hosted intents, paid AI, new paid service, schedule activation or auth cutover is part of this plan. Existing E01/E04 SQL and E09 recovery-window gaps remain separate approvals/work.
