# Continua editorial illustration system

Original hand-authored vector artwork, created for this addendum. The attached branded references supply direction only. No external illustration, logo, character, screenshot or proprietary asset was traced or copied.

## Three scenes

| Asset | Narrative | Placements |
|---|---|---|
| research-companion.svg | A curious reader examines a page beside an open book and small plant | Learn introduction and public resources story |
| watchlist-garden.svg | A person tends a small plant; a bookmark suggests patient attention | Empty watchlist and genuinely empty portfolio |
| shared-perspectives.svg | Two people exchange ideas over a notebook | Empty general TradersHub feed; never its failure state |

Visual grammar: simple expressive poses, rounded clean outlines at2.2 units, minimal faces, neutral ink#292630, Continua purple#7757c5, lavender#ebe4fa and paper#faf7f1. Repeated character proportions and restrained objects create a consistent family. No literal price charts, projected returns or invented financial claims are embedded in the artwork.

Assets are static SVG with320x220 viewBox. Individual files are approximately1.6–1.8KB; total4921 bytes before transport compression. They contain no script, image, foreignObject, animation, external href or entity. No animation/image-generation runtime dependency is added.

EditorialIllustration.jsx supplies explicit320x220 dimensions, responsive aspect ratio, lazy loading and asynchronous decoding. Artwork is decorative where nearby copy supplies the message, with empty alt and aria-hidden. A meaningful standalone use must provide a descriptive alt. Text/actions remain usable if the image fails. No artwork appears inside a price chart or an API-error state.

Tests enforce each file<4KiB and the family<8KiB, reject executable/external content and check its viewBox. Actual local browser render was reviewed at small mobile size and on the public site. High-resolution bitmap export is not required.
