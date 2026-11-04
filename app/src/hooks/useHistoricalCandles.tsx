import {cachedPriceHistory} from '@/lib/cachedPriceHistory.js';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {observedHistory} from '@/api/observedHistory';
import {priceWindow} from '@/lib/priceHistory';
export type {ChartPoint} from '@/lib/priceHistory';

/** Genuine OHLC and explicitly close-only observations; never generated bars. */
export function useHistoricalCandles(symbol: string | undefined, timeframe: string) {
    const client=useQueryClient();
    const isSupported = !!symbol;
    const window = priceWindow(timeframe);
    const query = useQuery({
        queryKey: ['continua', 'observed-price-history-v3', symbol, timeframe, window.from, window.to],
        queryFn: ({signal}) => observedHistory(symbol!,timeframe,signal),
        placeholderData:()=>{const previous=client.getQueryCache().findAll({queryKey:['continua','observed-price-history-v3',symbol,timeframe]}).filter(q=>Date.now()-q.state.dataUpdatedAt<86400000).sort((a,b)=>b.state.dataUpdatedAt-a.state.dataUpdatedAt)[0];return cachedPriceHistory(previous?.state.data,window);},
        enabled: isSupported, staleTime: 5 * 60_000, refetchOnMount: true, refetchInterval: 5 * 60_000, retry: 1,
    });
    return {points: query.data ?? [], isLoading: isSupported && query.isLoading, isSupported, isError: query.isError,refetch:query.refetch};
}
