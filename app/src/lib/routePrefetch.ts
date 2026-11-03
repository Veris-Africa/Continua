// Code only, at explicit navigation intent. No speculative private-data requests.
const loaders:Record<string,()=>Promise<unknown>>={
 '/':()=>import('../pages/Home'),
 '/markets':()=>import('../pages/Markets'),
 '/track-investments':()=>import('../pages/TrackInvestments'),
 '/traders-hub':()=>import('../pages/TradersHub'),
 '/account':()=>import('../pages/Account'),
};
const attempted=new Set<string>();
export function prefetchRoute(path:string){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 if(document.visibilityState!=='visible'||connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType??'')||attempted.size>=2||attempted.has(path)||!loaders[path])return;
 attempted.add(path);void loaders[path]().catch(()=>{attempted.delete(path);});
}
