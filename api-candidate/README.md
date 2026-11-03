# Native API candidate

This is Continua's guarded Go replacement candidate, not its deployed Node API.
The module name remains `continua/backend`; `cmd/continua` is the candidate server
and the other `cmd` directories contain operator executables. Keep loopback,
production-startup, credential, rights, payment and incomplete-ledger guards.

Run `go -C api-candidate test ./...`, `go -C api-candidate vet ./...` and
`go -C api-candidate build ./...` from repository root. Numerical integration
uses the explicit `NATIVE_PYTHON_BIN` and `financial-engine/worker.py`; dependency
requirements remain in `backend/python/requirements.txt`.

Build the candidate Dockerfile from repository root, not this directory:
`docker build -f api-candidate/Dockerfile .`. This is a test build, not approval
to deploy. The complete route/feature ledger remains in
`docs/architecture/NATIVE_REWRITE_LEDGER.json`; rename checks do not establish
unverified native/provider parity or authorize production cutover.
