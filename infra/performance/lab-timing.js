// Loopback lab only. Not imported by the app, never reports content or identity.
(() => {
  const emit = (event, values) => console.info('CONTINUA_LAB ' + JSON.stringify({event, ...values}));
  for (const type of ['paint', 'largest-contentful-paint', 'longtask', 'layout-shift']) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    let count = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (count++ >= 30) break;
        emit(type, {name:entry.name, at:entry.startTime, duration:entry.duration,
          ...(type==='layout-shift'?{value:entry.value,recentInput:entry.hadRecentInput}:{})});
      }
    }).observe({type, buffered:true});
  }
  const started = performance.now();
  emit('timing-observer', {at:started});
  let pendingRoute;
  const routeHeading={'/track-investments':'Portfolio','/markets':'Markets','/traders-hub':'TradersHub'};
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href]');if(!anchor)return;
    const url=new URL(anchor.href);if(url.origin!==location.origin||!routeHeading[url.pathname])return;
    pendingRoute={route:url.pathname,at:performance.now()};
  },true);
  const routeObserver=new MutationObserver(()=>{
    if(pendingRoute&&[...document.querySelectorAll('h1')].some(h=>h.textContent.trim()===routeHeading[pendingRoute.route])){
      emit('route-heading',{route:pendingRoute.route,ms:performance.now()-pendingRoute.at});pendingRoute=undefined;
    }
  });
  routeObserver.observe(document.getElementById('root'),{childList:true,subtree:true});
  setTimeout(()=>routeObserver.disconnect(),60000);
  const populated=document.querySelector('script[src="/__lab/timing.js"]')?.dataset.populated==='true';
  let contentReported=false,chartReported=false;
  const observer = new MutationObserver(() => {
    // Support both baseline and refined copy, avoiding an asymmetric observer
    // lifetime. Only timings are logged, never the account's text or values.
    const text = document.getElementById('root')?.textContent ?? '';
    if (!contentReported&&(populated?/(?:Recorded valuations:|\d+ recorded valuations)/.test(text):text.includes('Add your first holding'))) {
      emit('synthetic-home-content', {at:performance.now()});contentReported=true;
    }
    const curve=document.querySelector('[aria-label="Portfolio overview"] .recharts-area-curve[d]');
    if(populated&&!chartReported&&curve?.getAttribute('d')?.length>5){emit('synthetic-chart-visible',{at:performance.now()});chartReported=true;}
    if(contentReported&&(!populated||chartReported))observer.disconnect();
  });
  observer.observe(document.getElementById('root'), {childList:true,subtree:true});
  setTimeout(() => observer.disconnect(), 30000);
  setTimeout(() => {
    // Public built assets only. Never emit API URLs, query strings or images
    // from an account. Transfer can be zero when the browser reuses its cache.
    const assets=performance.getEntriesByType('resource').filter(entry=>{
      const url=new URL(entry.name);
      return url.origin===location.origin && /^\/(?:assets|illustrations)\//.test(url.pathname);
    });
    const sum=field=>assets.reduce((total,entry)=>total+(entry[field]||0),0);
    const bodyBytes=pattern=>assets.filter(entry=>pattern.test(new URL(entry.name).pathname)).reduce((n,entry)=>n+(entry.encodedBodySize||0),0);
    emit('public-asset-summary',{at:performance.now(),requests:assets.length,
      transferBytes:sum('transferSize'),encodedBodyBytes:sum('encodedBodySize'),
      decodedBodyBytes:sum('decodedBodySize'),javascriptBodyBytes:bodyBytes(/\.m?js$/),
      stylesheetBodyBytes:bodyBytes(/\.css$/),fontBodyBytes:bodyBytes(/\.woff2?$/),
      illustrationBodyBytes:bodyBytes(/\/illustrations\//)});
    document.documentElement.setAttribute('data-lab-timing','captured');
  },5000);
})();
