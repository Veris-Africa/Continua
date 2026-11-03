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
  const observer = new MutationObserver(() => {
    // Known synthetic Home landmarks; not a general account-content logger.
    const text = document.getElementById('root')?.textContent ?? '';
    if (text.includes('Add your first holding') || text.includes('Recorded valuations:')) {
      emit('synthetic-home-content', {at:performance.now()}); observer.disconnect();
    }
  });
  observer.observe(document.getElementById('root'), {childList:true,subtree:true});
  setTimeout(() => observer.disconnect(), 30000);
})();
