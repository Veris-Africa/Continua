# Phase 3 performance results

Measured locally on 3 November 2026 with disposable PostgreSQL 17.11, synthetic users and mocked provider HTTP. These figures are not production percentiles, billed Neon transfer, a provider latency estimate or an uptime SLO.

Final SQL fixture: **54 checks**, **734 ms** measured exercise interval, **159 instrumented top-level SQL calls**, **14,377 bytes** of JSON-serialized result values, four mocked provider verification GETs and **zero provider POSTs**. It includes 30 simultaneous duplicate deliveries, six drainers racing a callback, 12 independent renewal reservations, crash/retry/lease tests, periodic work tests, review/alert checks and recovery seeding. Setup/assertion SQL and SQL-function internal statements are not all counted by that instrumentation. SQL receipt acceptance across that synthetic duplicate burst measured 18 ms median and 106 ms p95; this excludes raw-signature middleware, network ingress, cold start and real provider latency. The fixture pool maximum was eight, reached eight connections and observed 30 queued queries during the deliberate burst. Production retains its existing maximum of ten, not a new pool.

The earlier smaller fixture completed in 369 ms; comparing their durations is not a performance regression test because coverage differs.

| Operation | Bounded database / resource behavior |
| --- | --- |
| Signed webhook intake | One INSERT/unique-conflict statement and a small id/status result; no body/card data persisted; 64KB request limit |
| Work claim | At most 50 expired/exhausted records reviewed, then one SKIP LOCKED claim; indexed due/lease/reference predicates |
| Completion / retry | One fenced UPDATE; no held connection during provider HTTP; inherited 15-second HTTP timeout |
| Known-order reconciliation seed | Two bounded INSERT..SELECT statements, at most 20 native + 20 hosted references per independent wake-up; no charge/init retry |
| Drainer | Starts at most five items; 40-second admission budget; already-started bounded verification can finish later; 180-second per-item lease |
| Renewal admission | Two candidates per enabled Phase 3 tick; existing owner lock, native active uniqueness and reference prevent duplicate initiation; queued/review work cannot starve the batch |
| Maintenance | One fixed durable record, ten-minute lease, five-attempt budget and hour-aligned next due; existing alert sweep already has a 45-second admission deadline and computation/query bounds |
| Operational status | Small aggregate payment/periodic/document reads; scheduled state changes use one batched UPSERT; GET is read-only; no user polling added |
| Collector status | One grouped SQL read; source/status/age counts only; no document blobs or archive re-download |
| Pool / cache | Existing application pool maximum 10; no new production pool/Redis/queue; Phase 1 public caching, private boundaries and SQL byte caps retained |

Backlog reports expose queue age, expired leases and retry exhaustion rather than concealing unknown work. Completion logs include processed counts and duration. Heartbeats/leases remain durable across process restarts. No high-frequency telemetry loop, keep-alive ping or new cron expression was introduced.

While awake, accepted events can trigger immediate best-effort draining. If that kick is lost, a configured independent maintenance wake-up resumes durable work. Existing hourly wake-up means recovery may wait an hour plus provider backoff/cold start, and a large backlog can take multiple bounded batches. That is an explicit free-tier latency tradeoff. A stricter cadence/paid always-on service needs measured demand and cost approval; none was provisioned or activated.

No new service fees were introduced. Existing Neon/Cloudflare/Render/Paystack quotas still apply, and durable metadata grows with event volume. No monthly transfer forecast or high-load capacity claim is made from this single fixture. Before activation, measure the current production backlog and expected payment rate with read-only aggregates, verify scheduler health and establish review/retention alerts. Financial history/source archive coverage was not reduced to obtain these results.
