export function PriceHistoryStatus({loading,error,reason,onRetry}){
 return <div role={loading?'status':undefined} className="text-center space-y-2">
  <p className="text-xs font-semibold">{loading?'Opening observed price history…':error?'Price history could not load':'Historical chart unavailable'}</p>
  {!loading&&<p className="text-xs text-muted-foreground">{error?'The history service could not complete. Missing records have not been assumed.':reason}</p>}
  {error&&<button type="button" className="text-xs text-primary underline" onClick={()=>void onRetry()}>Retry price history</button>}
 </div>;
}
