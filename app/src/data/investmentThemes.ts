/**
 * Single source of truth for Investment Themes — used by the Markets overview
 * carousel and the theme detail page it links to. Keeping one definition means
 * a theme's member stocks, blurb and "why" text can't drift between the two.
 */

export interface InvestmentTheme {
  slug: string;
  title: string;
  desc: string;
  stocks: string[];
  icon: string;
  why: string;
}

export const investmentThemes: InvestmentTheme[] = [
  {
    slug: "digital-banking",
    title: "Digital Banking",
    desc: "Lenders growing non-funded income from mobile channels",
    stocks: ["EQTY", "KCB", "COOP"],
    icon: "🏦",
    why: "Agency & mobile lending now drive >40% of group revenue",
  },
  {
    slug: "mobile-money",
    title: "Mobile Money",
    desc: "M-Pesa ecosystem and payment rails",
    stocks: ["SCOM", "NCBA", "ABSA"],
    icon: "💳",
    why: "Transaction volumes compounding at double digits",
  },
  {
    slug: "power-infrastructure",
    title: "Power & Infrastructure",
    desc: "Grid, generation and construction inputs",
    stocks: ["KPLC", "PORT"],
    icon: "⚡",
    why: "Tariff review and public works pipeline drive earnings",
  },
  {
    slug: "dividend-income",
    title: "Dividend Income",
    desc: "Consistent payers with covered distributions",
    stocks: ["BAT", "SCBK", "EABL"],
    icon: "💰",
    why: "Yields of 5–11% with multi-year payout track records",
  },
];

export const getThemeBySlug = (slug: string): InvestmentTheme | undefined =>
  investmentThemes.find(t => t.slug === slug);