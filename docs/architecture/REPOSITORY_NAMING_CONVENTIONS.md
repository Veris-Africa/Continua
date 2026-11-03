# Repository naming and boundary policy

Names describe responsibility and deployment status. Top-level service directories use lowercase kebab-case. Keep established production roots (`app`, `backend`, `scraper`) until a separately reviewed deployment-root migration is approved. A language is a tool, not the service's architectural identity.

| Previous path | Canonical path | Responsibility and status |
|---|---|---|
| `backend-go` | `api-candidate` | Native API replacement candidate; production guard remains; not the deployed Node API |
| `scraper-python` | `financial-data-collector` | Financial documents, market/news evidence, extraction, R2/checkpoint operations; finite Actions runner plus separately guarded candidate HTTP server |
| `engine-python` | `financial-engine` | Bounded numerical/research worker and reusable collector evidence-processing package; not a new production microservice |

## Files, imports and ecosystem conventions

- Preserve ecosystem entrypoints: `Dockerfile`, `go.mod`, `go.sum`, `package.json`, `__init__.py`, `main.py`, Vite configuration and framework entrypoints.
- React components use PascalCase, hooks use `useName`, and existing JavaScript service modules use descriptive lowerCamelCase. Do not rename a correct file simply to change case or extension.
- Python modules/packages retain snake_case and stable import names (`continua_scraper`, `continua_engine`). Go packages retain their declared names and the existing `continua/backend` module path. Directory moves do not authorize a public module/API change.
- New runtime code stays in its owning service; fixtures, release checks and operator tools belong under `infra` or `tools`. Declaration contracts are development interfaces, not duplicate runtime implementations.
- Use service-relative imports or one documented shared repository-path resolver for cross-service tooling. Never depend on a developer's absolute machine path. Resolve exact case, including on Linux.

## Deployment and migrations

Docker contexts, COPY paths, workflow path filters, working directories, dependency caches, CodeQL/Dependabot roots and Python search paths are part of the interface. Update and test every consumer of a moved directory. A changed CI/collector launch path needs explicit approval before production activation; a successful local rename is not deployment approval. Preserve all schedule gates and budgets.

Migration filenames and order are immutable unless an explicit migration-tool transition is approved. Historical SQL, restore fixtures, pending security/payment SQL and source evidence must not be relabeled as applied or deleted. Use status inventories and README indexes to clarify them.

## Rules for future agent work

Before a move, inventory tracked references and known provider roots; write the old/new mapping and role first. Use Git-aware moves, retain rollback history, and prove source/package/workflow resolution after each group. Never infer dead code from one zero-reference search. Check static and dynamic imports, CLI entrypoints, generated registries, workflow invocations and recovery tools. Delete only with an evidence ledger. Keep candidates visibly separate from production, and do not introduce language-suffixed top-level directories for new work without a documented architectural reason.

Language decision: retain existing Go, Python, JavaScript, React TypeScript and SQL. This phase changes organization and verified duplication, not runtimes or numerical semantics. Primary references: [Go module source](https://go.dev/doc/modules/managing-source), [Python modules/packages](https://docs.python.org/3/tutorial/modules.html), [Actions workflow paths](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Docker build contexts](https://docs.docker.com/build/concepts/context/).
