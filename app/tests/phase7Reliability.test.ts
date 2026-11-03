import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdentityClient} from '../src/integrations/continua/identityClient.js';
import {recordedPortfolioHistory} from '../src/lib/recordedPortfolioHistory.js';
import {workspaceRoute} from '../src/lib/workspaceRoute.js';
import {chartCoverage,normalizePriceHistory} from '../src/lib/priceHistory.ts';

test('expired session outage hides identity availability without logout and shares a retry cooldown',async t=>{
 let now=Date.now(),calls=0,unavailable=false;
 const session=()=>({user:{id:'fixture-owner'},expires_at:Math.floor(now/1000)+60,access_token:'header.payload.signature',refresh_token:'cookie-session'});
 const client=createIdentityClient({origin:'https://fixture.invalid',now:()=>now,location:()=>undefined,fetcher:async()=>{calls++;return unavailable?Response.json({error:'temporarily unavailable'},{status:503}):Response.json({session:session()});}});
 t.after(()=>client.destroy());const events:string[]=[];client.auth.onAuthStateChange(event=>events.push(event));
 await client.auth.restoreSession();unavailable=true;now+=61000;
 const results=await Promise.all(Array.from({length:20},()=>client.auth.getSession()));
 assert.ok(results.every(result=>result.error));assert.equal(calls,2);
 await client.auth.getSession();assert.equal(calls,2);
 assert.ok(events.includes('SESSION_UNAVAILABLE'));assert.ok(!events.includes('SIGNED_OUT'));
 unavailable=false;now+=10001;assert.equal((await client.auth.getSession()).error,null);assert.equal(calls,3);
});

test('recorded portfolio history never values current holdings retroactively or fills missing dates',()=>{
 const range={from:'2026-10-01',to:'2026-10-20'};
 const rows=[{date:'2026-10-03',value:'120',cost:'100',basis:'recorded_portfolio_snapshot'},
  {date:'2026-10-08',value:'0',cost:'0',basis:'recorded_portfolio_snapshot'},
  {date:'2026-10-04',value:999,cost:1,basis:'current_holdings_backcast'},
  {date:'2026-10-30',value:1,cost:1,basis:'recorded_portfolio_snapshot'}];
 const points=recordedPortfolioHistory(rows,range);
 assert.deepEqual(points.map(p=>[p.date,p.value,p.cost]),[['2026-10-03',120,100],['2026-10-08',0,0]]);
 assert.deepEqual(recordedPortfolioHistory([...rows,{...rows[0],value:'121'}],range).map(p=>p.date),['2026-10-08']);
 assert.equal(recordedPortfolioHistory([{...rows[0],value:null}],range).length,0);
});

test('two genuine weekly closes are visible with an explicit partial-coverage note, never fake intraday OHLC',()=>{
 const now=new Date('2026-11-03T12:00:00Z');
 const points=normalizePriceHistory([],[{date:'2026-11-02',close:10},{date:'2026-11-03',close:11}],'1W',now);
 assert.equal(chartCoverage(points,'1W','line',now).available,true);
 assert.match(chartCoverage(points,'1W','line',now).reason,/Partial 1W/);
 assert.equal(chartCoverage(points,'1D','line',now).available,false);
 assert.equal(chartCoverage(points,'1W','candle',now).available,false);
});

test('each workspace route has public page-specific geometry rather than account values',()=>{
 const paths=['/','/markets','/track-investments','/watchlist','/stock/SCOM','/traders-hub','/profile/fixture','/engine','/research'];
 assert.deepEqual(paths.map(path=>workspaceRoute(path).kind),['home','list','portfolio','list','stock','feed','profile','engine','research']);
});

import {createFollowMutationState} from '../src/lib/followMutationState.js';
test('follow intent is shared, owner-scoped and never makes an unacknowledged write successful',()=>{
 const state=createFollowMutationState();assert.equal(state.state('a','b',undefined),'unknown');
 assert.equal(state.begin('a','b',true),true);assert.equal(state.begin('a','b',true),false);
 assert.equal(state.state('a','b',false),'pending-follow');assert.equal(state.state('other','b',false),'not-following');
 state.finish('a','b',true);assert.equal(state.state('a','b',false),'failed');
 state.begin('a','b',false);assert.equal(state.state('a','b',true),'pending-unfollow');
 state.finish('a','b');assert.equal(state.state('a','b',false),'not-following');state.clear();assert.equal(state.state('a','b',undefined),'unknown');
});

import {observedHistoryResults} from '../src/lib/priceHistory.ts';
test('history retrieval failure stays distinct from a successful empty source and genuine partial data',()=>{
 const outage=Object.assign(new Error('fixture unavailable'),{status:503});const empty={status:'fulfilled',value:[]} as const;
 assert.throws(()=>observedHistoryResults([{status:'rejected',reason:outage},empty],'ALL'),/fixture unavailable/);
 assert.deepEqual(observedHistoryResults([{status:'rejected',reason:{status:404}},empty],'ALL'),[]);
 const actual={status:'fulfilled',value:[{date:'2026-10-01',close:10},{date:'2026-10-02',close:11}]} as const;
 assert.equal(observedHistoryResults([{status:'rejected',reason:outage},actual as any],'ALL').length,2);
});

import {createSessionWarmup} from '../src/lib/sessionWarmup.js';
test('bootstrap and AuthProvider share one verification result without caching credentials or replaying callbacks',async()=>{
 let calls=0;const expected={data:{session:null},error:null};const warm=createSessionWarmup(async()=>{calls++;return expected;},()=>({pathname:'/',search:'',hash:''}));
 assert.equal(warm.warm(),true);assert.equal(warm.warm(),true);assert.equal(calls,1);assert.equal(await warm.restore(),expected);assert.equal(calls,1);
 await warm.restore();assert.equal(calls,2);
 for(const location of [{pathname:'/auth',search:'',hash:''},{pathname:'/',search:'?neon_auth_session_verifier=fixture',hash:''},{pathname:'/',search:'',hash:'#recovery_token=fixture'}]){
  const callback=createSessionWarmup(async()=>{throw Error('One-use callback must not warm');},()=>location);assert.equal(callback.warm(),false);
 }
});
