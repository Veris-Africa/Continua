# Phase 7 chart diagnosis — addendum

Review date: 4 November 2026 (Africa/Nairobi). Baseline production commit3a78c6a00189aa4d8d33bcc3da8a3ce1774eb011 was verified live on both frontend and backend. Addendum changes stay local on codex/phase7-chart-visual-addendum.

## Verified findings

| Symptom | Evidence and cause | Local correction |
|---|---|---|
| History retry appears ineffective | Actual synthetic browser error state sent four failed GETs. Clicking Retry added no fifth request. The plot parent unconditionally captured the pointer, retargeting the button click. Both Home and Portfolio used this handler pattern. | Capture only when at least two plotted observations exist and the target is not an interactive control. Browser Retry now sends the next read and restores eight recorded points. |
| Current portfolio total exists but no history | Current authenticated production Home eventually resolves to empty history. Bounded read-only SQL found zero public.portfolio_snapshots rows and confirmed the expected eight columns. Current holdings/quotes and recorded valuations are separate data paths. | Share explicit loading/error/empty/one-point/series/gap states; preserve current summary and actual recorded history independently. Do not invent valuations. |
| Original screenshot says history could not load | The screenshot proves an earlier error presentation. Its original HTTP/database failure cannot be identified from the screenshot or the available generic request logs. The current production read did not reproduce it. | Add redacted operation/error-category metadata to the existing correlated logger; retain real transport failures and retry, never convert them to no history. No claim that the original upstream incident is solved. |
| 3M works while 1W is empty | Public APIs and permission-filtered publisher records contain older prices, but no weekly records. This is a publication gap, not a demonstrated weekly-rendering failure. | Exact daily windows and explicit dates; old observations do not spill into short windows through placeholder caches. |
| Timezone/cache inconsistencies | Old window dates used UTC and hook memoization only by timeframe; placeholder data could carry a previous date window. Daily axes used browser timezone. | Shared Nairobi date contract, date-aware cache keys, bounded overlapping-only cached preview and explicit Nairobi labels. |
| One observation rejected / ambiguous timestamps | Old coverage demanded two points for every chart and all 1D sampling was disabled. Canonical same-day duplicates could overwrite by input order. | One actual datum renders without a connecting path or return claim. Close-only data never becomes OHLC; contradictory canonical duplicates are withheld. |

## Production coverage evidence

Read-only transactions used BEGIN READ ONLY, 5-second statement_timeout and ROLLBACK on projectorange-bird-13151544, branchbr-noisy-block-b4z5yxup, neondb, computeep-nameless-voice-b4ygobrp. No production writes.

| Published NSE history | Last7 calendar dates (29Oct–4Nov) | Last30 dates (6Oct–4Nov) | Last90 dates (7Aug–4Nov) | Latest date | Latest history processing UTC |
|---|---:|---:|---:|---|---|
| SCOM | 0 | 13 | 54 | 23Oct2026 | 23Oct19:34:54.697717 |
| KCB | 0 | 13 | 55 | 23Oct2026 | 23Oct19:35:35.864485 |

Latest seven **recorded** session dates for both: 23,22,21,19,16,15,14October. This is not a claim that these are the latest seven sessions expected by a holiday calendar. No later published observations exist in this path. Weekends/holidays never create points or impose a fictitious five-per-week requirement.

The first public diagnostic requested Aug5–Nov3: SCOM3M returned56 rows, KCB57, both endingOct23; both weekly requests returned0. TOTL returned0 for both. The two additional early dates explain the difference from the exact new90-date count. Correlation IDs included SCOMweeklycaddae1f-21c2-4801-bbd4-92148f3b6b27 and SCOMlongeref988b72-d6bd-4156-9f0e-8627ebc7700f. A later public probe received429; no quota bypass or repeated API retry was attempted. The final counts above were a separately authorized bounded database diagnostic retaining the reader's source permission/provenance checks.

Raw canonical candle rows also exist but the recent sampled rows have null source_url and end in September; production correctly withholds unattributed rows. The API's usable October history comes from permitted processed publisher evidence. market.observed_daily_closes remains absent. Daily quotes/index levels are not automatically a retained historical price path.

## Timeframe contract

1D means today's date in Africa/Nairobi, showing a published daily sample as a single point, never fabricated intraday ticks. 1W/1M/3M include7/30/90 calendar dates including today. 1Y retains its365-day lookback (both endpoints can be present). ALL retains2015-01-01. Missing market sessions are not interpolated; no holiday calendar is inferred. A long gap greater than ten days remains explicitly insufficient for a continuous restricted-window trend.

Canonical source permissions, redistribution rights, publication/freshness rules, owner checks and numerical methods are preserved. No publisher data was promoted to certification.

## Tests and limits

Automated tests cover Nairobi midnight, invalid/naive timestamps, calendar windows, holiday/weekend gaps, old-versus-recent data, duplicates/conflicts, cache filtering and one point. Backend tests distinguish empty200 from permission403 and dependency503. Disposable PostgreSQL verified RLS/revocation/correction order/value-cost parity. Browser coverage is summarized in PHASE7_VISUAL_PERFORMANCE_RESULTS.md.

The precise upstream reason no newer history was processed remains unresolved: an existing document collection receipt was budget-paused and durable close retention is absent, but that does not prove a sole cause for every missing day. Existing Phase7 ingestion recovery/permission/migration approvals remain required. This addendum does not restore missing production records.
