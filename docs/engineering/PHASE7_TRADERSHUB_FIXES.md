# Phase 7 TradersHub fixes

## Initial profile/feed loading

UserProfile.tsx previously consumed a full usePosts timeline for actions and separately enriched profile posts using a 1+6N request pattern. usePosts({enabled:false}) now supplies actions without loading/writing shared feed state. Author filtering is handled by the existing aggregated community feed, with viewer/session/RLS/block/mute/keyword safeguards unchanged. Backend accepts one validated UUID author and refuses owner injection; response is bounded to the existing 50-post limit. Profile summary depends on user ID rather than refreshing token object.

## Follow and counts

followMutationState.js/useFollows.tsx share owner-target intent, reject competing clicks and distinguish unknown, pending, acknowledged and failed. IDs and counts remain query-cached and owner scoped; cross-tab invalidation uses the existing channel. Failure never increments counts or becomes success. No temporary fabricated zero is used for unknown counts. HubPostCard and profile use pending state.

## Browser and automated results

Sandbox synthetic followed-author feed hid Follow. Peer profile displayed Following and 1 follower. Synthetic unfollow acknowledged Follow/0 followers; follow acknowledged Following/1 follower and removed the post-level Follow action. No production relationships changed. Report form opened after lazy loading and retained its accessible reason/context/submit/close controls; no report submitted. Unit tests cover shared pending/failure/owner separation, and backend tests cover author scope/safety filters. Local acceptance screenshot: .qa-artifacts/phase7-sandbox-follow.png (synthetic only, ignored).

## Remaining limitations

No production feed latency percentile or cross-device cross-tab acceptance claim. Existing selected likes/bookmarks/reposts tabs retain enrichment fan-out, and profile/feed remain bounded first-page reads rather than a new keyset pagination implementation. Full social virtualization is not implemented. Do not claim all timeline scaling is solved.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
