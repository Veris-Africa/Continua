// Never infer past ownership from today's holdings or invent missing valuations.
export function recordedPortfolioHistory(rows,{from,to}){
 const values=new Map(),conflicts=new Set();
 for(const row of rows??[]){
  const date=row.date,value=Number(row.value),cost=Number(row.cost);
  if(row.basis!=='recorded_portfolio_snapshot'||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date<from||date>to||row.value==null||row.cost==null||!Number.isFinite(value)||value<0||!Number.isFinite(cost)||cost<0)continue;
  if(values.has(date)&&(values.get(date).value!==value||values.get(date).cost!==cost))conflicts.add(date);
  else values.set(date,{date,timestamp:Date.parse(date+'T00:00:00Z'),value,cost});
 }
 return [...values].filter(([date])=>!conflicts.has(date)).map(([,point])=>point).sort((a,b)=>a.timestamp-b.timestamp);
}
