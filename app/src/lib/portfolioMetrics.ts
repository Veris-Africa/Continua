/** Pure statistics helpers shared by the Correlation and Risk Analysis
 *  sections of the Analysis tab. Everything here operates on real daily
 *  return series derived from historicalApi candles — nothing here
 *  invents a number, though several metrics (beta, the composite risk
 *  score) are Continua's own definitions, not Simply Wall St's exact
 *  proprietary methodology, since that isn't published. */

export function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) out.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return out;
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

/** Pearson correlation between two return series, aligned by trimming to
 *  the shorter length (most-recent-first arrays should already be
 *  date-aligned by the caller). */
export function correlation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  const x = a.slice(0, n), y = b.slice(0, n);
  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return null;
  return num / denom;
}

/** OLS beta of `assetReturns` against `marketReturns` — covariance / variance. */
export function beta(assetReturns: number[], marketReturns: number[]): number | null {
  const n = Math.min(assetReturns.length, marketReturns.length);
  if (n < 5) return null;
  const a = assetReturns.slice(0, n), m = marketReturns.slice(0, n);
  const ma = mean(a), mm = mean(m);
  let cov = 0, varM = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (m[i] - mm);
    varM += (m[i] - mm) ** 2;
  }
  if (varM === 0) return null;
  return cov / varM;
}

export function annualizedVolatility(returns: number[]): number {
  return stdDev(returns) * Math.sqrt(252) * 100;
}

export function maxDrawdown(closes: number[]): number {
  let peak = -Infinity, worst = 0;
  for (const c of closes) {
    peak = Math.max(peak, c);
    if (peak > 0) worst = Math.min(worst, (c - peak) / peak);
  }
  return worst * 100;
}

const RISK_FREE_DAILY = 0.10 / 252; // ~10% annualized T-bill proxy, converted to a daily rate

export function sharpeRatio(returns: number[]): number | null {
  if (returns.length < 20) return null;
  const excess = returns.map((r) => r - RISK_FREE_DAILY);
  const sd = stdDev(excess);
  if (sd === 0) return null;
  return (mean(excess) / sd) * Math.sqrt(252);
}

export function sortinoRatio(returns: number[]): number | null {
  if (returns.length < 20) return null;
  const excess = returns.map((r) => r - RISK_FREE_DAILY);
  const downside = excess.filter((r) => r < 0);
  if (downside.length === 0) return null;
  const downsideDev = Math.sqrt(downside.reduce((s, r) => s + r * r, 0) / downside.length);
  if (downsideDev === 0) return null;
  return (mean(excess) / downsideDev) * Math.sqrt(252);
}