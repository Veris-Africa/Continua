/**
 * Seasonal logo campaigns — the "Christmas logo" mechanism.
 *
 * HOW TO RUN A TEMPORARY LOGO (e.g. for a holiday):
 *   1. Drop the new image in app/public/brand/ (e.g. logo-christmas.png —
 *      or logo-christmas-light.png / logo-christmas-dark.png if you want
 *      different art for light vs dark mode, same as the normal logo does).
 *   2. Add one entry to CAMPAIGNS below with its date range.
 *   3. Deploy.
 * The moment the end date passes, the app automatically falls back to the
 * normal logo (DEFAULT_LOGO_LIGHT_PATH / DEFAULT_LOGO_DARK_PATH) on its own —
 * nothing to remember to undo, and nothing else in the codebase needs to
 * change.
 *
 * Dates:
 *   - "MM-DD" (e.g. "12-15") recurs every year on that month/day — use this
 *     for anything annual like Christmas, so next December it just works
 *     again without touching this file.
 *   - "YYYY-MM-DD" (e.g. "2026-08-01") is a one-off, for something tied to a
 *     specific year (a launch anniversary, a one-time promotion, etc).
 *   - A range that crosses New Year's Eve (e.g. start "12-20", end "01-02")
 *     is handled correctly — it doesn't need to be split into two entries.
 *   - If more than one campaign's range is active on the same day, the first
 *     matching entry in the list below wins.
 */
export interface SeasonalLogoCampaign {
  /** Internal label only (shows up in comments/debugging, not in the UI). */
  name: string;
  /** Path under /public, used for BOTH light and dark mode — only needed if
   *  you're not providing the two theme-specific paths below. */
  imagePath?: string;
  /** Path under /public to use specifically in light mode. Falls back to
   *  imagePath, then to the normal light logo, if not given. */
  imagePathLight?: string;
  /** Path under /public to use specifically in dark mode (also used for
   *  AMOLED). Falls back to imagePath, then to the normal dark logo, if not
   *  given. */
  imagePathDark?: string;
  /** Inclusive start, "MM-DD" (recurring) or "YYYY-MM-DD" (one-off). */
  startDate: string;
  /** Inclusive end, same format as startDate. */
  endDate: string;
}

// The normal, non-seasonal logo — one design, two exports so it matches
// whichever theme the person has chosen (Settings → Appearance). AMOLED
// uses the dark version too.
export const DEFAULT_LOGO_LIGHT_PATH = "/brand/logo-light.png";
export const DEFAULT_LOGO_DARK_PATH = "/brand/logo-dark.png";

export const SEASONAL_LOGO_CAMPAIGNS: SeasonalLogoCampaign[] = [
  // Example — copy this, uncomment, and drop the matching image(s) in
  // app/public/brand/ to run it. A single imagePath is fine if you don't
  // need separate light/dark art for the campaign itself.
  // { name: "Christmas", imagePath: "/brand/logo-christmas.png", startDate: "12-15", endDate: "12-26" },
];