// Both portfolio surfaces use the same explicit read states. A transport error
// never becomes an empty result. One valuation is a point, not a return series.
export function portfolioHistoryState({points=[],error,pending=false,enabled=true}){
 if(!enabled)return {kind:'disabled',message:'Portfolio history hidden.'};
 if(!points.length&&pending)return {kind:'loading',message:'Opening recorded valuations…'};
 if(!points.length&&error)return {kind:'error',message:'Recorded history could not load. Retry when the connection is available.'};
 if(!points.length)return {kind:'empty',message:'No portfolio history has been recorded for this period.'};
 const from=points[0].date,to=points.at(-1).date;
 if(points.some((point,index)=>index>0&&point.timestamp-points[index-1].timestamp>10*86400000))return {kind:'insufficient',from,to,message:`${points.length} valuations exist from ${from} to ${to}, with a gap longer than ten days. A continuous trend is unavailable.`};
 return {kind:points.length===1?'point':'series',from,to,message:points.length===1?`One recorded valuation on ${from}. More observations are needed to show a trend.`:`${points.length} recorded valuations · ${from} to ${to}. Unrecorded dates are omitted.`,refreshError:!!error};
}
