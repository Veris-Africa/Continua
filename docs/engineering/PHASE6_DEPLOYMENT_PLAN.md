# Phase 6 deployment plan

Status: local implementation only. Owner explicitly prohibited pushing Phase 6 to main yet.

## Approval required

Approve the reviewed Phase 6 commit for push/release, specifically the candidate directory moves and changed GitHub Actions/CodeQL/Dependabot paths, finite collector entrypoint paths, Docker COPY contexts and service launch path references. These are deployment-sensitive even though production Render root directories remain backend and scraper. The new repository-layout CI step also needs inclusion in that reviewed release.

Approval does not cover SQL, environments, payment or AI activation, schedules, paid services, native API cutover or customer mutations. Those remain separate gates.

## Release procedure after approval

1. Complete every failed/pending relevant check in PHASE6_TEST_RESULTS.md and verify secrets/diff/lock inventory. Fetch main and integrate any changes without force push.
2. Verify external provider settings still point at retained production app/backend/scraper roots; identify external scripts using old candidate paths. Repository search cannot inventory private/off-repository references.
3. Review Actions workflow path changes while retaining event conditions, pause states, budgets and permissions. Do not manually enable paused jobs or collect live data as a test.
4. Push only the approved exact commit. Verify GitHub, both Cloudflare builds and Render revisions with the existing release verifier, accepting equivalent backend trees only when independently proven.
5. Perform authenticated read-only route checks, authorization denials and error monitoring. No charges, reactions or holdings edits. Verify the next already-authorized collector run's checkpoint and receipt continuity; do not create a replacement scheduler.
6. Stop/rollback if build paths, ingestion checkpoints or permissions regress.

No production migration or new infrastructure is needed for this restructuring. Manual Render deployment, if actually necessary, requires the owner authorization applicable to that release; no restart is proposed while its tree is unchanged.
