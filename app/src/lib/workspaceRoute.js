// Public route geometry only. Never contains cached account values or decisions.
export function workspaceRoute(path='/'){
 if(path.startsWith('/profile/'))return {kind:'profile',label:'Trader profile'};
 if(path.startsWith('/traders-hub')||path.startsWith('/post/'))return {kind:'feed',label:'TradersHub'};
 if(path.startsWith('/stock/'))return {kind:'stock',label:'Stock research'};
 if(path.startsWith('/track-investments'))return {kind:'portfolio',label:'Portfolio'};
 if(path.startsWith('/watchlist'))return {kind:'list',label:'Watchlist'};
 if(path.startsWith('/markets')||path.startsWith('/sector'))return {kind:'list',label:'Markets'};
 if(path.startsWith('/engine'))return {kind:'engine',label:'Continua Engine'};
 if(path.startsWith('/discover')||path.startsWith('/learn')||path.startsWith('/research'))return {kind:'research',label:'Research'};
 if(path.startsWith('/account')||path.startsWith('/settings'))return {kind:'profile',label:'Your account'};
 return {kind:'home',label:'Home'};
}
