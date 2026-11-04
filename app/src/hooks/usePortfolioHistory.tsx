import {portfolioHistoryState} from '@/lib/portfolioHistoryState.js';
import {useQuery} from '@tanstack/react-query';
import {supabase} from '@/integrations/continua/browserClient';
import {useAuth} from './useAuth';
import {priceWindow} from '@/lib/priceHistory';
import {recordedPortfolioHistory} from '@/lib/recordedPortfolioHistory.js';
export interface PortfolioHistoryPoint {date:string;timestamp:number;value:number;cost:number}
/** One owner-scoped recorded-history read; no current-holdings backcast. */
export function usePortfolioHistory(_holdings:{symbol:string;shares:number}[],timeframe:string,enabled=true){
 const {user}=useAuth(),range=priceWindow(timeframe);
 const query=useQuery({queryKey:['continua','recorded-portfolio-history',user?.id,range.from,range.to],
  enabled:enabled&&!!user,staleTime:60_000,gcTime:5*60_000,retry:1,
  queryFn:async({signal})=>{
   const result=await supabase.portfolioHistory(range,signal);
   if(result.error)throw result.error;
   if(!Array.isArray(result.data))throw new Error('Invalid recorded-history response');
   return recordedPortfolioHistory(result.data,range) as PortfolioHistoryPoint[];
  }});
 const points:PortfolioHistoryPoint[]=query.data??[];
 const state=portfolioHistoryState({points,error:query.error,pending:query.isPending,enabled:enabled&&!!user});
 return {state,points,isLoading:enabled&&!!user&&query.isPending,hasRealData:points.length>=1,error:query.error,refetch:query.refetch};
}
