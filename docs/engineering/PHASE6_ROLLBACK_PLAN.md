# Phase 6 rollback plan

Current local-only rollback: preserve work on codex/phase6-repository-structure, switch to verified main 9ab1945a7165a866200717a51f6d3fb34d3cf7f1 using a clean checkout/worktree. Do not discard unrelated user changes or use destructive resets.

After an approved release, revert the reviewed Phase 6 commit with a normal forward commit; never force-push. Restore old candidate directory prefixes, original workflow/Docker references and the analytics manifest/lock together from the prior revision, not isolated path fragments. The machine-readable mapping identifies every move. Keep collector job pause states, checkpoints and receipts intact; never replay data or broaden source rights to recover a path error.

Cloudflare can restore the verified Phase 5 Worker dd40a3bb-70d4-41a5-b237-b6f63c10adae through its existing release controls after approval. Production Render's verified 7dfe140d009ac78db072dc7b2dc4a30c7805e12b artifact has the same backend tree as Phase 5; retain it. Existing rollback images and historical SQL are untouched. No database rollback or identity reset is required because Phase 6 performs no production data/schema/environment mutation.

Re-run the release verifier and read-only application checks after rollback. A code rollback cannot repair pre-existing missing market history; retain honest evidence dates and unavailable states.
