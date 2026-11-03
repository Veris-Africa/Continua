# Continua architecture entrypoint

The deployed application is `app/` on Cloudflare, with Neon Managed Auth and the
existing Node API in `backend/` on Render. `scraper/` remains the existing
collection/read compatibility service. The finite Actions collector is
`financial-data-collector/`; source permissions, transfer budgets, R2 originals
and database checkpoints remain its operational boundaries.

`api-candidate/` is the guarded Go replacement candidate. `financial-engine/`
contains the bounded numerical/research worker and shared collector-processing
package. These names do not imply a native production cutover or a new service.
The shipped `backend/python/` calculations remain production dependencies and
parity references.

- [Component ownership and entrypoints](infra/repository/components.json)
- [Data architecture](docs/architecture/ARCHITECTURE.md)
- [Engine implementation status](docs/architecture/CONTINUA_ENGINE_IMPLEMENTATION.md)
- [Native release ledger](docs/architecture/NATIVE_REWRITE_LEDGER.json)
- [Naming and move policy](docs/architecture/REPOSITORY_NAMING_CONVENTIONS.md)
- [Database migration/recovery boundaries](infra/neon/README.md)

Runtime, schema, identity, financial and payment contracts remain stable during
Phase 6. Pending SQL and disabled payment/AI features require separate approval.
