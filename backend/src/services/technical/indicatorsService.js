import { candlesRepository } from "../../storage/repositories/candlesRepository.js";
import { sma, ema, rsi, macd } from "./indicators.js";
export const indicatorsService = {
    async compute(req, observations) {
        const securityId = `${req.exchange}:${req.symbol}`;
        // Candles are daily-only for every adapter today (see
        // adapters/mansa/mansaAdapter.ts's getCandles comment) — hardcoding
        // "1d" here rather than accepting an interval param the rest of the
        // system can't actually serve yet.
        const candles = observations ?? await candlesRepository.getCandles(securityId, "1d", req.from, req.to);
        if (candles.length === 0)
            return null;
        const timestamps = candles.map((c) => c.timestamp);
        switch (req.type) {
            case "SMA": {
                const values = sma(candles, req.period ?? 20);
                return { symbol: req.symbol, exchange: req.exchange, type: "SMA", timestamps, values, latest: lastNonNull(values) };
            }
            case "EMA": {
                const values = ema(candles, req.period ?? 20);
                return { symbol: req.symbol, exchange: req.exchange, type: "EMA", timestamps, values, latest: lastNonNull(values) };
            }
            case "RSI": {
                const values = rsi(candles, req.period ?? 14);
                return { symbol: req.symbol, exchange: req.exchange, type: "RSI", timestamps, values, latest: lastNonNull(values) };
            }
            case "MACD": {
                const values = macd(candles, req.fast ?? 12, req.slow ?? 26, req.signal ?? 9);
                const n = values.macd.length;
                return {
                    symbol: req.symbol, exchange: req.exchange, type: "MACD", timestamps, values,
                    latest: { macd: values.macd[n - 1] ?? null, signal: values.signal[n - 1] ?? null, histogram: values.histogram[n - 1] ?? null },
                };
            }
        }
    },
    async computeMany(requests) {
        // Job-scoped reuse only: no persistent rights/freshness cache and no
        // shortened history. Each calculation receives the same observations.
        const pending=new Map();
        return Promise.all(requests.map(async req=>{
            const key=JSON.stringify([req.exchange,req.symbol,req.from,req.to]);
            if(!pending.has(key))pending.set(key,candlesRepository.getCandles(`${req.exchange}:${req.symbol}`,'1d',req.from,req.to));
            return indicatorsService.compute(req,await pending.get(key));
        }));
    },
};
function lastNonNull(series) {
    for (let i = series.length - 1; i >= 0; i--) {
        if (series[i] != null)
            return series[i];
    }
    return null;
}
