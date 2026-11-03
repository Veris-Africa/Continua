/** Only daily observations covering the requested window may form a chart. */
export function hasHomeHistoryCoverage(points, period, now = Date.now()) {
  const days = { '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };
  if (period === '1D' || points.length < 2 || points.some(p => !Number.isFinite(p.value) || p.value < 0 || !Number.isFinite(p.timestamp) || p.timestamp > now)) return false;
  if (period === 'ALL') return true;
  const span = days[period];
  if(!span)return false;
  return points.every((point,index)=>point.timestamp>=now-(span+1)*86400000&&(!index||point.timestamp-points[index-1].timestamp<=10*86400000));
}
