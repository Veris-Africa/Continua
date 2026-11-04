import {historicalApi} from './historicalApi';
import {observedHistoryResults,priceWindow} from '@/lib/priceHistory';

/** Shared by stock and portfolio charts: use real candles or reported closes. */
export async function observedHistory(symbol,timeframe,signal){
 const window=priceWindow(timeframe);
 const results=await Promise.allSettled([
  historicalApi.getCandles(symbol,{signal,interval:'1d',from:window.from+'T00:00:00+03:00',to:window.to+'T23:59:59.999+03:00'}),
  historicalApi.getCloses(symbol,window,signal)
 ]);
 if(signal?.aborted)throw signal.reason;
 return observedHistoryResults(results,timeframe);
}
