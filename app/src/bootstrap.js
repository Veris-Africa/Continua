import {warmBrowserSession} from './integrations/continua/browserClient';
import {prefetchRoute} from './lib/routePrefetch';
// Start the same server check before downloading/parsing React and route code.
// The HTML contains public geometry; private views still wait for all gates.
if(document.visibilityState==='visible')warmBrowserSession();
prefetchRoute(window.location.pathname);
void import('./main.tsx');
