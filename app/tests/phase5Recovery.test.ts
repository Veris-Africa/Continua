import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreAccount} from '../src/lib/restoreAccount.ts';
import {readFollowingIds,readFollowCounts} from '../src/lib/followQueries.js';
import {createBrowserDataClient} from '../src/integrations/continua/browserDataClient.js';
import {QueryClient} from '@tanstack/react-query';
test('transient account failure recovers without sign-out; retries are bounded',async()=>{
 let calls=0;const waits:number[]=[];
 await restoreAccount(async()=>{if(++calls<3)throw {status:503};},()=>true,async ms=>{waits.push(ms);});
 assert.equal(calls,3);assert.deepEqual(waits,[500,1500]);
 calls=0;await assert.rejects(restoreAccount(async()=>{calls++;throw Error('offline');},()=>true,async()=>{}));assert.equal(calls,3);
});
test('authorization failures are never retried and cancelled restore stops',async()=>{
 for(const status of [401,403,400]){let calls=0;await assert.rejects(restoreAccount(async()=>{calls++;throw {status};},()=>true,async()=>{}));assert.equal(calls,1);}
 let active=true,calls=0;await restoreAccount(async()=>{calls++;throw {status:503};},()=>active,async()=>{active=false;});assert.equal(calls,1);
 calls=0;await assert.rejects(restoreAccount(async()=>{calls++;throw Object.assign(Error('timeout'),{name:'TimeoutError'});},()=>true,async()=>{}));assert.equal(calls,1);
});
function fixture(fetcher:typeof fetch){return createBrowserDataClient({origin:'http://localhost',identity:{getSession:async()=>({data:{session:{access_token:'synthetic'}},error:null})},fetcher});}
test('following consumers share one minimal read and remain isolated by account',async()=>{
 const calls:string[]=[];const client=fixture(async(url)=>{calls.push(String(url));await new Promise(r=>setTimeout(r,2));return Response.json([{following_id:'target'}]);});
 const cache=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
 const read=(owner:string)=>cache.fetchQuery({queryKey:['continua','following-ids',owner],staleTime:60000,queryFn:()=>readFollowingIds(client,owner)});
 const [a,b]=await Promise.all([read('owner-a'),read('owner-a')]);assert.deepEqual(a,['target']);assert.equal(a,b);assert.equal(calls.length,1);
 await read('owner-a');assert.equal(calls.length,1);await read('owner-b');assert.equal(calls.length,2);
 assert.ok(calls[0].includes('select=following_id'));assert.ok(calls[0].includes('follower_id=eq.owner-a'));assert.ok(calls.every(url=>!url.includes('profiles')));cache.clear();
});
test('unknown following and missing count metadata never become a false or zero result',async()=>{
 const unavailable=fixture(async()=>Response.json({message:'denied'},{status:403}));
 await assert.rejects(readFollowingIds(unavailable,'owner'));
 const unknown=fixture(async()=>new Response(null,{status:200}));assert.deepEqual(await readFollowCounts(unknown,'target'),{followers:null,following:null});
 const zero=fixture(async()=>new Response(null,{status:200,headers:{'Content-Range':'*/0'}}));assert.deepEqual(await readFollowCounts(zero,'target'),{followers:0,following:0});
});
