# Financial research engine

`worker.py` implements the bounded stdin/stdout numerical/research protocol;
`continua_engine` supplies calculations and evidence/document processing used
by the native API candidate and finite collector. `engine_cli.py` is the offline
draft-only operator interface. Python package names and wire operations are stable.

This directory is not a new always-on service or a replacement for the production
API's `backend/python` calculations. Those implementations remain required
production dependencies and parity oracles. Do not consolidate them without
numerical, missing-data, precision, rights and historical-contract evidence.

Run `python -m unittest discover -s financial-engine/tests -v` from repository
root using an environment containing `backend/python/requirements.txt`. Additional
reference comparisons are under `infra/migration/native-*-parity.mjs`. They must
use fixture inputs, not production credentials or paid provider calls.
