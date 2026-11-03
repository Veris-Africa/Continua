# Phase 7 rollback plan

Known production baseline7fd6f34ab543012eec18fd2cd7eb5d244570534d; Cloudflare Worker9172cd69-02a0-44d6-897a-1ef0221a9857 and existing-additive-20261102 backend schema were verified. No Phase7 SQL/env/payment activation is prepared as an implicit deployment step.

## Code rollback

If frontend causes regressions, redeploy the previous known-good frontend revision while keeping managed Auth settings unchanged; frontend first avoids depending on a new read endpoint after backend rollback. If backend is faulty, restore the exact prior Node revision through an approved deployment/restart. Preserve logs/correlation receipts; clear only ordinary process caches through restart, never customer data. Git rollback uses an ordinary reviewed revert commit or deployment rollback, never force push.

If auth startup regresses, rollback bootstrap/identity consumer code as a unit; never rotate credentials, switch provider or delete identities as recovery. If portfolio/history failure occurs, old empty/error behavior is safer than manufacturing observations. Existing snapshot rows remain untouched. New read routes perform no mutation to reverse.

Collector summary rollback restores prior scheduled_collect.py import/call and removes run_health.py in a regular reviewed commit. Its health presentation is not a license/allowance/freshness override. Preserve durable reservation ledger, leases/checkpoints, published observations and receipts.

## Data changes are separate

A future approved retention migration must have its own staged rollback. Disable newly activated writers before considering schema removal; retain evidence and customer snapshots. Do not drop populated tables to rollback UI code. Any future snapshot recording must be idempotent and preserve provenance; a UI rollback must not erase recorded customer history.

## Verification

Verify exact old frontend/backend revisions, valid existing session/read access, private owner boundaries, quote/history coverage notes, subscription read correctness and next already-authorized collector receipt. No reset, charge, production write or external settings change is part of rollback testing.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
