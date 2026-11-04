// Returning published observations may preview a new date window, but never
// carry yesterday's out-of-range points into a short-range chart.
export function cachedPriceHistory(points,{from,to}){
 if(!Array.isArray(points))return undefined;
 const selected=points.filter(p=>p&&typeof p.date==='string'&&p.date>=from&&p.date<=to&&Number.isFinite(p.timestamp)&&Number.isFinite(p.price)&&p.price>0);
 return selected.length?selected:undefined;
}
