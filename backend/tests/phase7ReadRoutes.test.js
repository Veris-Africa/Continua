import {afterEach,expect,it,vi} from 'vitest';
import express from 'express';
import {rateLimit} from 'express-rate-limit';
import {createBrowserDataRouter} from '../src/data/browserDataRoutes.js';
import {portfolioHistoryQuery} from '../src/data/portfolioHistory.js';
const servers=[];
afterEach(async()=>{await Promise.all(servers.splice(0).map(server=>new Promise(resolve=>server.close(resolve))));});
async function fixture(verifier=async()=>({claims:{sub:'viewer-a',role:'authenticated'}})){
 const query=vi.fn(async sql=>({rows:sql.includes('row_to_json')?[{payload:JSON.stringify({date:'2026-10-03',value:'120.25',cost:'100',basis:'recorded_portfolio_snapshot'})}]:[]}));
 const client={query,release:vi.fn()},database={connect:vi.fn(async()=>client)},verifyAccess=vi.fn(verifier);
 const app=express();app.use(rateLimit({windowMs:60000,limit:100}));app.use(express.json());app.use('/data',createBrowserDataRouter({database,verifyAccess}));
 const server=app.listen(0,'127.0.0.1');servers.push(server);await new Promise(resolve=>server.once('listening',resolve));
 return {url:'http://127.0.0.1:'+server.address().port+'/data',client,database,verifyAccess};
}
const headers={'X-User-Token':'fixture-token'};
it('recorded history is private, verified once and constrained by owner plus existing RLS/session guard',async()=>{
 const f=await fixture(),r=await fetch(f.url+'/portfolio_history?from=2026-10-01&to=2026-10-20',{headers});
 expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toContain('private, no-store');
 expect(await r.json()).toEqual([{date:'2026-10-03',value:'120.25',cost:'100',basis:'recorded_portfolio_snapshot'}]);
 expect(f.verifyAccess).toHaveBeenCalledTimes(1);expect(f.client.query.mock.calls.some(([sql])=>sql.includes('SET LOCAL ROLE authenticated'))).toBe(true);
 expect(f.client.query.mock.calls.some(([sql])=>sql==='SELECT public.continua_session_guard()')).toBe(true);
 const [sql,params]=f.client.query.mock.calls.find(([sql])=>sql.includes('row_to_json'));
 expect(params).toEqual(['viewer-a','2026-10-01','2026-10-20']);expect(sql).toContain('WHERE user_id=$1');expect(sql).toContain('LIMIT 1001');
 expect(sql).not.toMatch(/INSERT|UPDATE|DELETE|portfolios\s/i);expect(f.client.release).toHaveBeenCalledTimes(1);
});
it('anonymous, injected-owner and malformed-date reads never acquire SQL connections',async()=>{
 const f=await fixture();expect((await fetch(f.url+'/portfolio_history')).status).toBe(401);
 for(const query of ['user_id=viewer-b','from=2026-02-30','from=2026-10-01&from=2026-10-02','to=2099-01-01'])expect((await fetch(f.url+'/portfolio_history?'+query,{headers})).status).toBe(400);
 expect(f.database.connect).not.toHaveBeenCalled();
});
it('provider outage is a retryable private failure, never an anonymous history fallback',async()=>{
 const f=await fixture(async()=>{throw Error('provider unavailable');}),r=await fetch(f.url+'/portfolio_history',{headers});
 expect(r.status).toBe(503);expect(r.headers.get('retry-after')).toBe('5');expect(f.database.connect).not.toHaveBeenCalled();
});
it('author-scoped feed keeps the verified viewer and safety clauses while rejecting ownership injection',async()=>{
 const f=await fixture(),author='22222222-2222-4222-8222-222222222222';
 expect((await fetch(f.url+'/community_feed?author='+author,{headers})).status).toBe(200);
 const [sql,params]=f.client.query.mock.calls.find(([sql])=>sql.includes('row_to_json'));
 expect(params).toEqual(['viewer-a',author]);expect(sql).toContain('p.user_id=$2');expect(sql).toContain('public.hidden_posts');expect(sql).toContain('public.blocked_users');expect(sql).toContain('LIMIT 50');
 expect((await fetch(f.url+'/community_feed?author='+author+'&user_id=viewer-b',{headers})).status).toBe(400);
});
it('history writes remain unavailable and oversized reads fail rather than silently truncate',async()=>{
 const f=await fixture();expect((await fetch(f.url+'/portfolio_history',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}'})).status).toBe(404);
 f.client.query.mockImplementation(async sql=>({rows:sql.includes('row_to_json')?Array.from({length:1001},()=>({payload:'{}'})):[]}));
 expect((await fetch(f.url+'/portfolio_history',{headers})).status).toBe(413);
});
it('empty recorded history stays a successful empty read while permission and database failures stay errors',async()=>{
 const f=await fixture();
 f.client.query.mockResolvedValue({rows:[]});
 let response=await fetch(f.url+'/portfolio_history',{headers});
 expect(response.status).toBe(200);expect(await response.json()).toEqual([]);
 f.client.query.mockImplementation(async sql=>{if(sql.includes('row_to_json'))throw Object.assign(new Error('Private SQL detail'),{code:'42501'});return {rows:[]};});
 response=await fetch(f.url+'/portfolio_history',{headers});expect(response.status).toBe(403);
 expect(await response.text()).not.toContain('Private SQL detail');
 f.client.query.mockImplementation(async sql=>{if(sql.includes('row_to_json'))throw Object.assign(new Error('Private timeout detail'),{code:'57014'});return {rows:[]};});
 response=await fetch(f.url+'/portfolio_history',{headers});expect(response.status).toBe(503);
 expect(await response.text()).not.toContain('Private timeout detail');
});
it('history date validation uses Nairobi midnight consistently with the browser, not UTC midnight',()=>{
 const query=portfolioHistoryQuery('viewer-a',new URLSearchParams({from:'2026-11-04',to:'2026-11-04'}),new Date('2026-11-03T21:01:00Z'));
 expect(query.params).toEqual(['viewer-a','2026-11-04','2026-11-04']);
 expect(query.sql).toContain("AT TIME ZONE 'Africa/Nairobi'");
 expect(()=>portfolioHistoryQuery('viewer-a',new URLSearchParams({to:'2026-11-05'}),new Date('2026-11-03T21:01:00Z'))).toThrow();
});
