# Financial data collector

`scheduled_collect.py` is the finite, budgeted Actions entrypoint for document,
news and market-evidence collection. `continua_scraper` owns discovery, bounded
downloads/browser work, extraction, R2 originals, source permissions, leases,
transfer reservations, receipts and recovery. Its import name is unchanged.

`main.py` is a different interface: a loopback-only candidate HTTP server with
production startup blocked. Do not deploy it in place of the current Render
scraper merely because both use collection code. `scraper/` remains a separate
compatibility service and test oracle.

Install `requirements-lock.txt` in an isolated environment and run
`python -m unittest discover -s financial-data-collector/tests -v` from root.
Provide the existing `financial-engine` library on PYTHONPATH when a processing
entrypoint requires it. Standard `main.py`, `scraper_cli.py`, `browser_worker.py`,
`requirements*.txt` and `continua_scraper` interfaces are retained.

The Docker build context is repository root:
`docker build -f financial-data-collector/Dockerfile .`. Scheduled workflow path
changes are deployment-sensitive; Phase 6 remains local until separately approved.
No schedule state, source permission, transfer budget, schema, account or paid
service is activated by this rename.
