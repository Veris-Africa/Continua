# Phase 5 rollback

Current production baseline is Phase 4 `7dfe140d009ac78db072dc7b2dc4a30c7805e12b`, Cloudflare Worker `c32836d1-5a1c-441c-bfb8-a3d275b10f4b`, Render deployment `dep-dbks2759fdbs73c6nlk0`. Phase 5 has not been pushed or deployed, so no production rollback is currently needed.

If an approved later frontend release regresses login, isolation, navigation, follow state, chart inspection or data loading, roll the frontend back to the retained Phase 4 Cloudflare artifact or revert the approved Phase 5 commits and run normal CI. Verify release metadata, issuer, authenticated read and anonymous denial afterward. Preserve backend deployment, all production data, auth identities and newly created records.

There are no Phase 5 schema changes to reverse and no payment/event records to delete. Do not restore a database merely to undo frontend code. No disabling auth, permission checks or financial coverage rules to improve apparent availability. New follow caches are memory-only and existing logout clearing remains; old versioned published research formats are unchanged.

For Phase 4 itself, prior backend artifact `66de6e460784be52964c144a29721db70e9a2fb8` / `dep-dbko4joae00c73fovtr0` and earlier compatible frontend artifacts are recorded. A rollback must be coordinated with actual backend/frontend compatibility, without production DDL or a global write freeze inferred from this document.


## Release follow-up — 2026-11-03

The owner subsequently approved the Phase 5 main release. Commit 9ab1945a7165a866200717a51f6d3fb34d3cf7f1 is on main and all GitHub checks passed. Cloudflare serves that revision (Worker dd40a3bb-70d4-41a5-b237-b6f63c10adae). Render remains at 7dfe140d009ac78db072dc7b2dc4a30c7805e12b; independently verified identical backend trees make a restart unnecessary. The release verifier passed with --allow-equivalent-backend-tree at 2026-11-03T15:20:41.772Z. Authenticated read-only journeys covered the existing application and upgrade interfaces. Earlier candidate-only statements above describe the original gate; known performance/data/security limitations remain. No production SQL, environment, payment or schedule activation occurred. Phase 6 is separate and local only; see PHASE6_IMPLEMENTATION.md.
