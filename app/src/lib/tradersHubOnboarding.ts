/**
 * Shared option lists for TradersHub onboarding + wherever a chosen value
 * needs to be redisplayed (e.g. the experience badge on UserProfile). Kept
 * separate from lib/handle.ts since these are onboarding-specific, not
 * identity/handle concerns.
 */

export const EXPERIENCE_OPTIONS = [
  { id: "beginner", label: "Beginner", blurb: "New to investing" },
  { id: "intermediate", label: "Intermediate", blurb: "Comfortable with the basics" },
  { id: "advanced", label: "Advanced", blurb: "Actively trade multiple sectors" },
  { id: "professional", label: "Professional", blurb: "Work in finance or trade for a living" },
] as const;

export const EXPERIENCE_LABELS: Record<string, string> = Object.fromEntries(
  EXPERIENCE_OPTIONS.map(o => [o.id, o.label])
);

/**
 * Gender is collected for aggregate demographic analysis only — it is
 * never shown on a profile and is never selectable back over the API (see
 * migration 20260824090000). "Prefer not to say" is a first-class,
 * equally-sized option, not an afterthought skip link.
 */
export const GENDER_OPTIONS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "prefer_not_to_say", label: "Prefer not to say" },
] as const;