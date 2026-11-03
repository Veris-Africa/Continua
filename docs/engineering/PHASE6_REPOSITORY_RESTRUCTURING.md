# Phase 6 restructuring ledger

Base: released main `9ab1945a7165a866200717a51f6d3fb34d3cf7f1`. Phase 6 is local only. Mapping and consumer inventory were established before any move. The initial tracked inventory contains 277 API candidate files, 123 collector files and 83 financial-engine files; 57 tracked files reference the previous directory names. Ignored caches/virtual environments are not source inventory and are not deletion candidates.

| Old directory | New directory | Evidence and activation boundary |
|---|---|---|
| `backend-go/` | `api-candidate/` | Own `go.mod` (`continua/backend`), native API/operator executables, guard and ledger; referenced by candidate Docker, CodeQL, Dependabot, security and parity workflows. No Render production root points here. |
| `scraper-python/` | `financial-data-collector/` | `scheduled_collect.py` is a finite, budgeted Actions runner; `main.py` is a distinct loopback-only candidate server. Docker, workflows, operator scripts and package tests reference this path. Collector CI launch changes need approval before activation. |
| `engine-python/` | `financial-engine/` | `worker.py` serves the bounded native numerical protocol; `continua_engine` is also imported by collection/research processing. Candidate Docker, PYTHONPATH and parity fixtures reference it. Production backend keeps `backend/python`. |

All files under each directory follow the same prefix mapping. Preserve relative subpaths, Python import package names, Go module identity, exported contracts and standard entrypoint filenames. The complete file mapping is `docs/architecture/PHASE6_PATH_MAPPING.json`.

The root `CONTINUA_ENGINE_IMPLEMENTATION.md` is also moved to
`docs/architecture/CONTINUA_ENGINE_IMPLEMENTATION.md`. It is architecture/status
documentation, not a runtime or migration entrypoint. Both tracked citation
consumers (`docs/neon-migration/DEPENDENCY_AUDIT.md` and `dependencies.json`) are
updated. Its present-tense database description is corrected to Neon PostgreSQL;
historical validation counts and incomplete candidate status are retained.

## Retained roots

`app/` is the deployed Vite/Cloudflare application. `backend/` is the deployed Node compatibility API plus its shipped Python numerical libraries. `scraper/` is the existing Node collection/read compatibility service and numerical/discovery oracle. Changing these provider roots is unnecessary for this phase and requires a separate deployment-root review. `supabase/` retains historical migration and platform recovery interfaces; a compatibility variable name does not establish a Supabase connection. `infra/`, `tools/`, `.github/`, and `docs/` already describe their responsibilities.

Historical documents that navigate source paths are updated to the canonical directory names; cited historical commit IDs and validation counts retain their original meaning. No previously recorded partial native coverage becomes complete because of a rename. No production service is created, switched or removed.
