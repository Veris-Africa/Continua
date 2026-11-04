# Collector workflow failure investigation — 4 November 2026

## Verified evidence

Workflow: `Bounded financial collection outside Render`, run [115](https://github.com/cypskip-create/Continua/actions/runs/41750094542), baseline `3a78c6a`. Setup and dependency/tool installation succeeded. All three attempts failed in collection. The latest preceding scheduled runs 110–114 succeeded; this is not a failure of every schedule.

- Attempt 1: KenyanStocks fetched/extracted ten artifacts; two browser stage timeouts (`browser_exit_16`), one `fetch:TransferLimitReached`, then a generic failed postprocessing receipt. Transfer counters reached 50,279,240 bytes of the 50,331,648-byte reservation. The next transfer was correctly refused, but software mislabeled that refusal as an ordinary document failure.
- Attempt 2: one browser timeout, one unclassified parsing ValueError, two AfricanFinancials HTTP 403 responses. Twenty processed observations included sixteen usable observations; this does not certify current company fundamentals.
- Attempt 3: two parsing ValueErrors, two AfricanFinancials HTTP 403 responses, finite source pauses. Processing completed 28 items / 24 observations, and 25 processed exports succeeded. The source errors correctly kept this attempt failed.

Bounded production diagnostics used read-only transactions and rolled back. Three latest parse dead letters relate to PDF artifacts of 37,302, 37,865 and 149,168 bytes. They carry no issuer/tab context in the sampled job record. After the owner's explicit approval, a first-chunk response check of their existing publisher asset URLs returned HTTP 200, application/pdf and `%PDF-` headers for all three. No PDF text, URL path/query, database credential or document body was printed or committed. Current headers do not prove the original downloaded bytes or explain the original parser exception.

## Software fixes

1. AdapterRunner distinguishes TransferLimitReached from real provider/parse errors. It retains completed counters, closes owned files, and leaves the incomplete durable lease recoverable. Targeted coverage stays incomplete rather than being falsely marked complete.
2. Browser rendering propagates an exhausted shared transfer budget instead of misclassifying a resulting worker exit as a source timeout. A genuine worker timeout with available allowance remains a failure.
3. GenericCrawler propagates the same budget exception with a partial receipt; it does not mark a publisher URL failed or write a dead letter for the budget condition.
4. Postprocessing archive-budget exhaustion no longer overwrites already completed research statistics with a generic processing failure. Unverified exports remain pending. A prior real source failure still wins over budget-paused status.
5. Actions summaries include bounded, allowlisted source error categories and failure counts. Unknown strings, URLs and provider messages are excluded. Invalid PDF headers receive a stable safe category; this is additional diagnostics, **not** a claim that the three observed PDFs have invalid headers.

No workflow error is suppressed, no continue-on-error added, and no failed source is disabled. No schedule, transfer allowance, runtime duration, source permission, publication validation, database schema or provider configuration changed. No live collector retry was dispatched: that would consume another production reservation and perform collection writes. An old-run retry would also execute the old commit.

## Remaining failures

AfricanFinancials refused the runner with HTTP 403. Code cannot grant publisher access. Obtain permitted publisher access or separately review disabling/replacing that source; do not bypass its protection. Its refusal remains a failure under the existing policy. AFX and KenyanStocks finite source timeouts remain explicit pauses or failures according to their existing context.

The precise ValueError from the three PDF parse jobs is not recoverable from the existing redacted exception-class-only receipt. Valid current HTTP/PDF headers rule out only a current missing header. Do not label this fully resolved or promise the next live schedule will pass. Inspect a future safe categorized receipt and, if necessary, reproduce parsing from the retained immutable PDF in an approved isolated diagnostic. Never alter financial values or promote unvalidated evidence to make the run green.

## Language, tests and release

Retain Python 3.13 and the existing asyncio/durable-job implementations. [Python timeout documentation](https://docs.python.org/3.13/library/asyncio-task.html#timeouts) distinguishes timeout transformation from cancellation; [HTTP 403 semantics](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden) describe refusal, not a reason to repeat identical requests indefinitely. Decision recorded in FEATURE_LANGUAGE_DECISIONS.json.

Validation: **221 tests run, 215 passed, six existing environment-dependent skips**, zero failures. The offline collector suite includes typed budget propagation through browser/adapter/crawler, scheduled-run mocked storage exhaustion, preservation of real failures, source-policy/authorization checks and summary redaction. No live publisher/database test is represented as a full ingestion success. Tracked-file secret audit and diff whitespace checks also passed.

Release is the owner's requested push to main. Roll back by reverting this commit through a normal reviewed change; keep persisted evidence and provider settings. These code fixes do not require a schema change or manual production deployment on Render (the collector executes on Actions).
