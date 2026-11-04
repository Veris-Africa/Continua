# Continua visual language

A refinement of the existing Inter typography, purple identity and navigation. No wholesale redesign. Reference attachments were inspected:1loading skeleton,2populated Home/error,3modular widgets,4outline character,5hand-drawn application,6lime-accent financial application. Their order differs from the textual labels. They are direction only; none was installed as a product asset.

## Existing-system tokens

Tokens live in app/src/styles/brand-system.css; opt in with data-surface="soft" rather than replacing every Card.

| Token / rule | Value / intent |
|---|---|
| --module-radius | 20px; controls and existing navigation retain their own radii |
| --module-surface | light255254252; dark292734; AMOLED999/11 neutral |
| --module-border | neutral ink6.5% in light; pale8–9% in dark |
| --module-shadow | 03px14px at3.5% ink; none in dark/AMOLED |
| --section-space | 1.75rem editorial section rhythm |
| --skeleton-fill | existing muted at70% |
| Typography | existing Inter, strong tabular valuation, smaller secondary figures, no new font |
| Brand / movement | existing purple, bull and bear tokens; never rely solely on red/green without signs/labels |
| Interactive state | existing focus ring plus2px opt-in module focus outline; existing touch targets |

Use whitespace for section separation. Keep the principal portfolio valuation/chart on the canvas. Group metrics in one row with restrained inset separators. Market Snapshot is one soft module; indices remain an open row, with no nested individual index cards. Quick Watch remains a compact scrolling row. Research shortcuts receive quiet item surfaces. Selected account/research/education widgets may opt in; tables and dense price screens retain readability.

Dark/AMOLED use the same spacing/radii and explicit neutral surfaces. Illustrations retain their light paper field so ink stays legible in either theme; this does not change the app's global scheme. Safe-area padding and bottom navigation remain. Reduced motion disables the delayed skeleton reveal and existing ticker motion.

## Skeletons

No visible Home/page-name/loading-workspace heading. Assistive status remains. Header/summary/chart/metrics/market/quick-watch geometry previews Home. Other routes retain profile/list/feed geometry. The short CSS reveal avoids flashing on very fast transitions without delaying real content; no new JavaScript timer or animation library. The existing navigation stays outside route Suspense; initial authentication shows noninteractive bottom-nav geometry only.

## Implementation discipline

The blanket .home-flow > div bottom border caused the repeated rules and was removed. Explicit financial-table and metric separators remain. Existing flat Card resets exclude only deliberately opted-in soft content surfaces. No global box nesting, new banking features, currency/value changes or feature hierarchy changes.
