/**
 * Single source of truth for Markets "Featured Lists" — used by the Markets overview
 * grid and the list detail page it links to, so a list's member stocks can't drift
 * between the two. Icons are looked up by slug in each consuming file (kept out of
 * this data module so it stays plain/serializable).
 */

export interface FeaturedList {
  slug: string;
  title: string;
  desc: string;
  symbols: string[];
  color: string;
}

// "Top Movers" intentionally isn't a featured list — Top Gainers/Losers already covers
// daily moves elsewhere on the Overview tab, so it doesn't belong here too.
export const featuredLists: FeaturedList[] = [
  { slug: "blue-chip-nse", title: "Blue Chip NSE", desc: "Largest & most stable", symbols: ["SCOM", "EQTY", "KCB", "SCBK", "EABL", "BAT", "COOP", "NCBA"], color: "bg-primary/10 text-primary" },
  { slug: "high-dividend", title: "High Dividend", desc: "Yield > 5%", symbols: ["BAT", "SCBK", "ABSA", "KCB", "NCBA"], color: "bg-bull/10 text-bull" },
  { slug: "undervalued", title: "Undervalued", desc: "Smaller-cap opportunities", symbols: ["KPLC", "EGAD", "SCAN", "SMER", "CIC", "OCH"], color: "bg-chart-3/10 text-chart-3" },
];

export const getFeaturedListBySlug = (slug: string): FeaturedList | undefined =>
  featuredLists.find(l => l.slug === slug);