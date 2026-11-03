# Continua

Continua is an African markets and investing platform. It combines live and
historical market data, portfolio tracking, company research, alerts,
screening, financial news, and an investor community in one mobile-first app.

## Services

- `app/` — React, Vite, TypeScript, Tailwind, React Query, and the owned Continua identity/data API.
- `backend/` — Express REST/WebSocket market-data API, ingestion workers,
  research calculations, technical indicators, and multi-exchange adapters.
- `api-candidate/` — guarded Go replacement candidate and operator executables;
  not the production API. Module identity remains `continua/backend`.
- `financial-data-collector/` — finite Actions document/news/market-evidence
  collection, R2 persistence and checkpoint recovery; its HTTP server remains
  a separately guarded candidate.
- `financial-engine/` — bounded Python numerical/research worker and reusable
  evidence-processing package. Production API calculations in `backend/python`
  remain the compatibility reference.
- `scraper/` — polite, robots-aware news and filing ingestion with RSS,
  HTML, PDF, OCR, deduplication, provenance, retries, and dead letters.
- `infra/neon/` — Neon PostgreSQL migration, permissions and operational tooling.
- `supabase/` — historical SQL and recovery references; no production connection.
- `docs/` — API, architecture, data-flow, and deployment documentation.

The frontend is deployed through Cloudflare; Neon Managed Auth owns identity,
and Render's existing Node services retain their deployment roots. A directory
rename does not switch runtimes, enable a schedule, apply SQL or activate billing.
See [naming conventions](docs/architecture/REPOSITORY_NAMING_CONVENTIONS.md),
[component ownership](infra/repository/components.json), and
[the complete Phase 6 path mapping](docs/architecture/PHASE6_PATH_MAPPING.json).

Run `node --test infra/repository/*.test.mjs` to check component entrypoints,
retired execution paths and exact-case filenames. The one-time Phase 6 source
identity receipt uses `node infra/repository/audit-layout.mjs --verify-move-identity`;
historical hashes do not prohibit legitimate future implementation changes.

## Local development

```bash
npm install
npm run dev
```

The backend and scraper have their own dependencies and environment files:

```bash
cd backend && npm install && npm run dev
cd scraper && npm install && npm run dev
```

Copy each service's `.env.example` to `.env` and provide a PostgreSQL URL.
See `docs/deployment/RENDER_DEPLOY.md` for deployment configuration.

## Verification

```bash
npm run build
npx tsc --noEmit -p app/tsconfig.app.json
cd backend && npm run typecheck && npm test
cd scraper && npm run typecheck && npm test
```

The backend integration suite is opt-in because it truncates its dedicated
test database. Set `RUN_INTEGRATION_TESTS=true` with a migrated test-only
`DATABASE_URL` to run it.
