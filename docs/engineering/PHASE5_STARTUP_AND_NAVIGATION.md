# Startup and navigation

The original gates replace the document with session/assurance spinners; route chunks render a generic workspace message. These gates serialize identity restoration, assurance and route loading. Render Free explicitly warns of wake-up delays of 50 seconds or more; no frontend optimization guarantees a fast full-data cold start.

`WorkspaceSkeleton` contains public geometry only, has a named busy status, fixed chart/list regions and motion-safe pulse. Root session, assurance, device-lock loading and nested route boundaries use it. Social/profile routes reserve list geometry and stock routes reserve chart/stat geometry. Existing bottom navigation remains mounted during nested route suspension. A shell is not a verified identity or entitlement.

Ordinary session recovery retries up to twice after 500/1500 ms for eligible failures, then exposes the existing explicit Retry account connection UI. Authorization errors, timeouts/aborts and one-use OAuth/recovery exchanges are not replayed. No password, refresh token or account decision is persisted by this work. Signed-out behavior, MFA enforcement and biometric lock remain in place.

Code prefetch is triggered by pointer/focus navigation intent only, capped at two distinct routes, and skips hidden tabs/save-data/2G. Failed chunk loading retains existing bounded chunk recovery. No portfolio, subscription or feed requests are prefetched.

Home's covered chart and changing-number animation are lazy with honest fallbacks. The chart's original pointer inspection and ReferenceDot are retained in the extracted plot. Export code is loaded on export; existing lazy PDF chunks remain. Existing image preparation, lazy media, asynchronous decoding, reserved gallery dimensions and original R2 uploads were retained, without paid image services.

Stock and portfolio chart freshness reuse prevents forced repeat history reads inside the existing five-minute window. Financial statements retain published-query hydration, 30-minute stale time and refresh in the background every 30 minutes while observed/visible; TanStack's default suppresses background interval polling. Refresh failures retain loaded statements with explicit status text. A fresh request after expiry still validates the backend and permissions.

No numerical transformations changed. UTC date normalization, sorting, duplicate/conflict rejection, positive-price checks, null preservation, intraday unavailability, two-observation minimum and coverage checks were inspected; existing tests exercise these rules. Live SCOM reported last close 2026-10-23 and correctly withheld stale month history. Backend/ingestion recovery is deferred, not concealed with an invented curve.
