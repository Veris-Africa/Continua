import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probe} from './health-probe.mjs';

test('permission and rate limits stop after one read without retrying or logging bodies',async()=>{
 for(const status of [401,403,429]){
  let calls=0;const delays=[];
  const result=await probe('market','https://fixture.invalid',{request:async()=>{calls++;return new Response('private provider detail',{status});},wait:async ms=>delays.push(ms)});
  assert.equal(calls,1);assert.equal(result.ok,false);assert.deepEqual(delays,[]);
  assert.equal(JSON.stringify(result).includes('private provider'),false);
 }
});
test('transient reads back off with jitter and recover within three attempts',async()=>{
 let calls=0;const delays=[];
 const result=await probe('backend','https://fixture.invalid',{request:async()=>++calls<3?new Response('',{status:503}):Response.json({status:'alive'}),wait:async ms=>delays.push(ms),random:()=>0.5});
 assert.equal(result.ok,true);assert.equal(calls,3);assert.deepEqual(delays,[2500,4500]);
});
