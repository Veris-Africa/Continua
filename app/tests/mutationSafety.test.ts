import test from 'node:test';
import assert from 'node:assert/strict';
import {createMutationIntent} from '../src/lib/mutationIntent.js';
import {createPostSubmission} from '../src/lib/postSubmission.js';
import {costMinorUnits,holdingInputError,combinedAverageCost} from '../../backend/src/data/holdingContract.js';
test('pending creates reuse an ID; confirmed or distinct actions and owners get new IDs',()=>{
 let count=0;const intent=createMutationIntent(()=>String(++count));
 const first=intent.prepare({user_id:'A',symbol:'SCOM'});
 assert.equal(intent.prepare({user_id:'A',symbol:'SCOM'}).id,first.id);
 intent.confirm(first.id);assert.notEqual(intent.prepare({user_id:'A',symbol:'SCOM'}).id,first.id);
 assert.equal(intent.prepare({user_id:'B',symbol:'SCOM'}).id,'3');
});
test('an ambiguous post result preserves media and the exact intent for retry',async()=>{
 let inserts=0,uploads=0,removes=0;const ids:string[]=[];
 const submit=createPostSubmission({newId:()=> 'stable-intent',upload:async()=>{uploads++;return 'https://owned.invalid/photo';},remove:async()=>{removes++;},insert:async payload=>{ids.push(payload.id);inserts++;return inserts===1?{error:new Error('lost response')}:{data:{id:payload.id},error:null};}});
 const input={userId:'owner',content:'Synthetic post',images:['data:image/png;base64,fixture']};
 assert.ok((await submit(input)).error);assert.equal(removes,0);
 assert.equal((await submit(input)).data.id,'stable-intent');assert.equal(uploads,1);assert.deepEqual(ids,['stable-intent','stable-intent']);
});
test('parallel composer submits share one upload/write and new posts are not content-deduplicated',async()=>{
 let uploads=0,writes=0,next=0;const submit=createPostSubmission({newId:()=>String(++next),upload:async()=>{uploads++;return 'https://owned.invalid/photo';},remove:async()=>{},insert:async payload=>{writes++;return {data:payload,error:null};}});
 const input={userId:'owner',content:'Same text',images:['data:fixture']};
 const replies=await Promise.all(Array.from({length:8},()=>submit(input)));
 assert.equal(uploads,1);assert.equal(writes,1);assert.equal(new Set(replies.map(r=>r.data.id)).size,1);
 assert.notEqual((await submit(input)).data.id,replies[0].data.id);assert.equal(writes,2);
});
test('only never-submitted failed uploads are cleaned up',async()=>{
 let calls=0,removed:string[]=[];const submit=createPostSubmission({upload:async()=>{if(++calls===2)throw Error('upload failed');return 'https://owned.invalid/unused';},remove:async urls=>{removed=urls;},insert:async()=>{throw Error('must not submit');}});
 assert.ok((await submit({userId:'owner',content:'Synthetic',images:['data:first','data:second']})).error);
 assert.deepEqual(removed,['https://owned.invalid/unused']);
});
test('holding input matches whole shares and exact positive KES cents without changing missing values',()=>{
 assert.equal(costMinorUnits('12.34'),1234n);assert.equal(costMinorUnits(null),null);assert.equal(costMinorUnits(0),0n);
 for(const value of [{shares:0,avg_cost:1},{shares:1.5,avg_cost:1},{shares:1,avg_cost:0},{shares:1,avg_cost:1.005},{shares:2147483648,avg_cost:1}])assert.ok(holdingInputError(value));
 assert.equal(holdingInputError({shares:7,avg_cost:12.34}),null);
 assert.equal(combinedAverageCost(1,1,1,1.01),1.01);assert.equal(combinedAverageCost(7,12.34,2,10.01),11.82);
 assert.equal(holdingInputError({avg_cost:undefined},true),null);
});

test('folder retry retains its original sort payload when refreshed folder count changes',()=>{
 let count=0;const intent=createMutationIntent(()=>String(++count));const key={user_id:'A',name:'Ideas'};const first=intent.prepare({...key,sort_order:1},key);assert.deepEqual(intent.prepare({...key,sort_order:2},key),first);intent.confirm(first.id);assert.notEqual(intent.prepare({...key,sort_order:2},key).id,first.id);
});
