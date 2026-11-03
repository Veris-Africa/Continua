# Phase 7 deployment plan

## Current state

Phase6 main/frontend/backend is7fd6f34ab543012eec18fd2cd7eb5d244570534d, verified live; all commit checks completed successfully. Phase7 branch remains local. Owner explicitly says do not automatically push Phase7. This document is a reviewable plan, not deployment authorization.

## Release gates

1. Review local exact commit, diff,13 reports and retained inventory; ensure no secrets/generated artifacts staged. Existing security, financial/numeric, backend, frontend, collector, layout and managed-issuer checks must pass.
2. Outstanding measurement: final mobile throttled/field acceptance using an owner-approved testing surface. Paired sandbox instrumentation verifies unthrottled paint/content improvements, but does not reproduce the previous throttled mobile lab. Intermediate mobile LCP8.935sec did not meet acceptance. Do not call this target complete.
3. Verify next already-authorized collector run on Phase6 and its relocated checkpoint/import paths. Latest observed runs were pre-release; do not dispatch a job solely to create a green receipt.
4. Obtain approval for exact Phase7 commit before non-force main push. Production collector outcome code is included and must be explicitly covered by approval; its budgets/schedules/permissions do not change.
5. Deploy Node backend before frontend consumes /data/portfolio_history and author-scoped feed. Verify exact revision health/readiness, private route anonymous denial503 outage behavior, owner isolation, no customer writes. If automatic Render deployment stalls, request approval for a specific manual backend revision/restart.
6. Deploy Cloudflare frontend using current pinned managed Auth configuration. Verify artifact secret/issuer checks and exact revision. Smoke read Home, Portfolio, Stock Detail and TradersHub with existing signed-in account. Do not submit production reactions/follows/reports for smoke. Monitor error/latency/auth outcomes and transfer receipts.
7. Stop/rollback on session misclassification, cross-owner data, increased provider storms or numerical mismatch.

## Separate approvals (not bundled into UI release)

- Production observed-close retention SQL, source mapping/permission and bounded recovery/backfill.
- Any portfolio snapshot recorder, historical ledger backfill, schedule/allowance changes or job activation.
- Any paid infrastructure or provider configuration change.

No environment modification is required for the prepared UI/private read changes. Existing migration is not run by deployment. Source rights and data gaps remain visible.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
