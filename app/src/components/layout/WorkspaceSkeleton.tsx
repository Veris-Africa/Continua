// Public geometry only: never render cached account data before session/lock checks.
export function WorkspaceSkeleton({path='/',label='Opening Continua'}:{path?:string;label?:string}) {
 const social=path.startsWith('/traders-hub')||path.startsWith('/profile/');
 const stock=path.startsWith('/stock/');
 return <main role="status" aria-label={label} aria-busy="true" className="min-h-dvh bg-background px-4 py-6 pb-24">
  <span className="sr-only">{label}</span>
  <div aria-hidden="true" className="mx-auto max-w-2xl space-y-6 motion-safe:animate-pulse">
   <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-muted"/><div className="h-6 w-36 rounded bg-muted"/></div>
   <div className={social?'h-12 rounded-full bg-muted':'h-52 rounded-2xl bg-muted'}/>
   {stock&&<div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><div key={i} className="h-20 rounded-xl bg-muted"/>)}</div>}
   {[0,1,2].map(i=><div key={i} className="space-y-3 border-b pb-6"><div className="h-5 w-2/3 rounded bg-muted"/><div className="h-4 w-full rounded bg-muted"/><div className="h-4 w-4/5 rounded bg-muted"/></div>)}
  </div>
 </main>;
}
