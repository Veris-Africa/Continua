// Code only, at explicit navigation intent. No speculative private-data requests.
const loaders:Record<string,()=>Promise<unknown>>={
 '/':()=>import('../pages/Home'),
 '/markets':()=>import('../pages/Markets'),
 '/track-investments':()=>import('../pages/TrackInvestments'),
 '/traders-hub':()=>import('../pages/TradersHub'),
 '/account':()=>import('../pages/Account'),
 '/engine':()=>import('../pages/Engine'),
 '/stock/:symbol':()=>import('../pages/StockDetail'),
 '/profile/:userId':()=>import('../pages/UserProfile'),
 '/watchlist':()=>import('../pages/Watchlist'),
};
const attempted=new Set<string>();
export function prefetchRoute(path:string){
 path=path.startsWith('/stock/')?'/stock/:symbol':path.startsWith('/profile/')?'/profile/:userId':path;
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 if(document.visibilityState!=='visible'||connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType??'')||attempted.size>=2||attempted.has(path)||!loaders[path])return;
 attempted.add(path);void Promise.all([loaders[path](),import('../components/layout/MainLayout')]).catch(()=>{attempted.delete(path);});
}
