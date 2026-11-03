import type {FiscalPeriodType} from '../api/types';

export function financialHistoryWindow(symbol:string|undefined,periodType:FiscalPeriodType,limit:number) {
  const fetchLimit=Number.isInteger(limit)&&limit>=1&&limit<=100
    ? Math.max(limit,periodType==='annual'?20:50) : limit;
  return {fetchLimit,queryKey:['continua','financials-history',symbol,periodType,fetchLimit] as const};
}
