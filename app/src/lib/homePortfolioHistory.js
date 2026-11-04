import {priceWindow} from './priceHistory.ts';
import {portfolioHistoryState} from './portfolioHistoryState.js';
/** Compatibility adapter for the shared recorded-history contract. */
export function hasHomeHistoryCoverage(points,period,now=Date.now()){
 if(points.some(p=>!Number.isFinite(p.value)||p.value<0||!Number.isFinite(p.timestamp)||p.timestamp>now))return false;
 const range=priceWindow(period,new Date(now));
 const selected=points.map(p=>({...p,date:p.date??new Date(p.timestamp).toISOString().slice(0,10)})).filter(p=>p.date>=range.from&&p.date<=range.to);
 return ['point','series'].includes(portfolioHistoryState({points:selected}).kind);
}
