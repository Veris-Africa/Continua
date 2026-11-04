import {marketDate,observationDate} from '../../../backend/src/domain/marketDate.js';
export interface PriceObservation {
    timestamp?: string; date?: string; close: number;
    open?: number | null; high?: number | null; low?: number | null; volume?: number | null;
    sourceUrl?: string; adjustment?: string; basis?: string;
}
export interface ChartPoint {
    date: string; price: number; close: number; timestamp: number; up: boolean;
    open?: number; high?: number; low?: number; volume?: number;
    body?: [number, number]; wickRange?: [number, number]; sourceUrl?: string;
}
const day = 86_400_000;
const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
export function priceWindow(timeframe: string, now = new Date()) {
    const to=marketDate(now)!;
    const end=new Date(to+'T00:00:00Z');
    const days=({'1D':1,'1W':7,'1M':30,'3M':90,'1Y':366} as Record<string,number>)[timeframe]??1;
    const start=timeframe==='YTD'?new Date(Date.UTC(end.getUTCFullYear(),0,1))
      :timeframe==='ALL'?new Date('2015-01-01T00:00:00Z'):new Date(end.getTime()-(days-1)*day);
    return {from:start.toISOString().slice(0,10),to};
}
export const priceWindowDescription='Daily observations in Africa/Nairobi: 1D is today; 1W/1M/3M include the last 7/30/90 calendar dates; 1Y retains its 365-day lookback. Weekends, holidays and missing sessions are not filled.';
/** Exact observed closes only. Conflicting same-day sources are withheld. */
export function normalizePriceHistory(candles: PriceObservation[], closes: PriceObservation[], timeframe: string, now = new Date()): ChartPoint[] {
    const {from, to} = priceWindow(timeframe, now), selected = new Map<string, PriceObservation>(), conflicts = new Set<string>();
    for (const row of closes) {
        if(!row||typeof row!=='object')continue;
        const key = observationDate(row);
        if(!key)continue;
        if (selected.has(key) && selected.get(key)!.close !== row.close) conflicts.add(key);
        else selected.set(key, row);
    }
    for (const key of conflicts) selected.delete(key);
    const canonical=new Map<string,PriceObservation>(),ambiguous=new Set<string>();
    for (const row of candles) {
        if(!row||typeof row!=='object')continue;
        const key = observationDate(row);
        if(!key)continue;
        const complete = positive(row.open) && positive(row.high) && positive(row.low) && positive(row.close)
            && row.high >= Math.max(row.open, row.close, row.low) && row.low <= Math.min(row.open, row.close);
        if(complete){const previous=canonical.get(key);if(previous&&(['open','high','low','close','volume'] as const).some(field=>previous[field]!==row[field]))ambiguous.add(key);else canonical.set(key,row);}
    }
    for(const [key,row]of canonical){if(ambiguous.has(key))selected.delete(key);else selected.set(key,row);}
    return [...selected].filter(([key, row]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key >= from && key <= to && positive(row.close)
        && Number.isFinite(Date.parse(key)) && new Date(key).toISOString().slice(0, 10) === key)
        .sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) => {
            const ohlc = positive(row.open) && positive(row.high) && positive(row.low) && row.high >= Math.max(row.open, row.close, row.low) && row.low <= Math.min(row.open, row.close);
            return {date: key, timestamp: Date.parse(key + 'T00:00:00Z'), price: row.close, close: row.close,
                open: ohlc ? row.open! : undefined, high: ohlc ? row.high! : undefined, low: ohlc ? row.low! : undefined,
                body: ohlc ? [Math.min(row.open!, row.close), Math.max(row.open!, row.close)] as [number, number] : undefined,
                wickRange: ohlc ? [row.low!, row.high!] as [number, number] : undefined, up: ohlc ? row.close >= row.open! : false,
                volume: typeof row.volume === 'number' && Number.isFinite(row.volume) && row.volume >= 0 ? row.volume : undefined,
                sourceUrl: row.sourceUrl};
        });
}
export function chartCoverage(points: ChartPoint[], timeframe: string, chartType: string, now = new Date()) {
    if (!points.length) return {available:false,reason:timeframe==='1D'?'No published daily observation for today in Nairobi. Intraday observations are not available.':'No recorded prices in this calendar window. A longer range may contain older observations.'};
    const window=priceWindow(timeframe,now);
    if(points.some(point=>point.date<window.from||point.date>window.to||!positive(point.price)||!Number.isFinite(point.timestamp)))return {available:false,reason:'Observations fall outside the selected Nairobi date window or contain invalid prices.'};
    if (chartType === 'candle' && points.some(p => p.open == null || p.high == null || p.low == null))
        return {available: false, reason: 'Only closing prices are available. Candlesticks require reported open, high and low values. Your chart-type choice is retained.'};
    if(points.length===1)return {available:true,pointOnly:true,reason:`One observed daily price on ${points[0].date}. No intraday path or price trend is implied.`};
    if (timeframe !== 'ALL') {
        const {from, to} = priceWindow(timeframe, now), start = Date.parse(from), end = Date.parse(to), span = Math.max(1, (end - start) / day);
        const tolerance = Math.min(7, Math.max(3, span * .1));
        const enough = points.length >= Math.max(2, Math.floor(span * 5 / 7 * .6));
        const gaps = points.some((p, i) => i > 0 && p.timestamp - points[i - 1].timestamp > 10 * day);
        if(gaps)return {available:false,reason:'Recorded prices contain a gap longer than ten days. Missing dates are not interpolated.'};
        if (!enough || points[0].timestamp > start + tolerance * day || points.at(-1)!.timestamp < end - 7 * day)
            return {available:true,partial:true,reason:`Partial ${timeframe} coverage: ${points.length} observed closes from ${points[0].date} to ${points.at(-1)!.date}. Missing dates are not generated.`};
    }
    return {available: true, reason: `${points.length} observed prices · ${points[0].date} to ${points.at(-1)!.date}. No missing dates or OHLC values are generated.`};
}

/** An empty successful fallback must not disguise another source's outage. */
export function observedHistoryResults(results:PromiseSettledResult<PriceObservation[]>[],timeframe:string,now=new Date()){
    const [candles,closes]=results;
    const points=normalizePriceHistory(candles?.status==='fulfilled'?candles.value:[],closes?.status==='fulfilled'?closes.value:[],timeframe,now);
    const failure=results.find((result):result is PromiseRejectedResult=>result.status==='rejected'&&(result.reason?.status!==404));
    if(!points.length&&failure)throw failure.reason;
    return points;
}
