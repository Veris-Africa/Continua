import {workspaceRoute} from '@/lib/workspaceRoute.js';
// Public layout geometry only. Labels are for assistive technology, not titles.
export function WorkspaceSkeleton({path='/',label='Content is updating'}:{path?:string;label?:string}) {
 const {kind}=workspaceRoute(path),chart=['home','stock','portfolio'].includes(kind);
 return <main role="status" aria-label={label} aria-busy="true" className="workspace-skeleton" data-skeleton-kind={kind}>
  <span className="sr-only">{label}</span>
  <div aria-hidden="true" className="skeleton-content">
   <header className="skeleton-header"><i className="skeleton-avatar"/><div><i className="skeleton-bar title"/><i className="skeleton-bar short"/></div><i className="skeleton-control"/></header>
   <div className="skeleton-session"><i className="skeleton-bar short"/><i className="skeleton-bar tiny"/></div>
   {chart?<section className="skeleton-portfolio"><div className="skeleton-toolbar"><i className="skeleton-bar short"/><div>{[0,1,2,3].map(i=><i key={i} className="skeleton-control"/>)}</div></div><i className="skeleton-value"/><i className="skeleton-bar short"/><div className="skeleton-plot"/><div className="skeleton-metrics">{[0,1,2].map(i=><div key={i}><i className="skeleton-bar short"/><i className="skeleton-bar title"/></div>)}</div></section>:kind==='profile'?<section className="skeleton-profile"><div/><i className="skeleton-avatar"/><i className="skeleton-bar title"/></section>:<div className="skeleton-search"/>}
   {kind==='home'?<div className="skeleton-modules"><section><i className="skeleton-bar title"/><div className="skeleton-index-row">{[0,1,2].map(i=><div key={i}><i className="skeleton-bar short"/><i className="skeleton-bar title"/><i className="skeleton-bar tiny"/></div>)}</div></section><section><i className="skeleton-bar title"/><div className="skeleton-watch-row">{[0,1,2].map(i=><div key={i}><i className="skeleton-bar short"/><i className="skeleton-bar title"/></div>)}</div></section></div>:<div className="skeleton-route-rows">{[0,1,2].map(i=><div key={i} className={kind==='feed'||kind==='profile'?'skeleton-post':'skeleton-instrument'}><i className="skeleton-avatar"/><div><i className="skeleton-bar title"/><i className="skeleton-bar short"/></div><i className="skeleton-bar tiny"/></div>)}</div>}
  </div><div className="skeleton-bottom" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i}/>)}</div>
 </main>;
}
