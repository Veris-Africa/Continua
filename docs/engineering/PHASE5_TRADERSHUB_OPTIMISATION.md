# TradersHub and profiles

Previously each `useFollows` instance requested own followers, following profiles and a second following-ID projection. Depending on nonempty lists, that was three to five reads per hook mount. The profile and its mounted follower dialog each created a hook. Counts then fetched full profile lists again merely to take their lengths. The hook also returned false while loading.

Now all mounted consumers share `['continua','following-ids',owner]`, with 60-second stale time and one ID-only request. Full lists use owner/target/direction cache keys and load only when explicitly needed. An executable synthetic transport test verifies simultaneous consumers share one request, a warm consumer adds none, a different owner gets a separate request, and no profiles are downloaded for button state. These are request-count results, not measured Neon egress.

Profile counts issue two parallel HEAD/exact-count reads, scoped by viewer and target. Missing headers and failed reads do not become zero. Zero is displayed only when confirmed. Unknown following is `undefined`; follow actions cannot run until resolved. Suggested-person buttons now say Saving while pending and become retryable after failure instead of falsely confirming Following.

Successful follow/unfollow writes update the shared ID cache and invalidate counts/lists. Same-account cross-tab notices trigger revalidation; no profile rows, session tokens or passwords are broadcast. Existing sign-out/account-change cache removal remains. Backend RLS/ownership/entitlements remain authoritative. No optimistic authorization or payment decision was added.

Likes, Bookmarks and Portfolio fetch on selected tabs. The existing profile feed lookup is retained because reaction toggling still depends on that state; removing it without an independent reaction contract could regress toggling. Profile instances remount by viewer/target to avoid displaying a previous target's local state. The existing single guarded `community_feed` read, safety filtering and latest-50 limit remain; no broad fallback on authorization/provider failure was introduced.

Remaining backend work: per-post count enrichment in older profile collections, complete cursor pagination and cross-process aggregation. Large-row downloads are not an acceptable frontend substitute. Account-switch, blocked/muted content and two-tab browser mutation checks with realistic fixtures are outstanding acceptance checks; unit/cache tests do not establish all browser behavior.

New graph/count/list queries expire from memory five minutes after their last observer, rather than inheriting the application's 24-hour global retention. No private graph cache is persisted. The synthetic two-tab follow acknowledgement/count scenario passed; broader privacy and account-switch races remain separate acceptance checks.
