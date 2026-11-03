import {test} from 'node:test';import assert from 'node:assert/strict';
import {createErrorReporter,safePage} from '../src/lib/errorReports.js';
test('browser errors are opt-in, bounded, deduplicated and exclude sensitive content',()=>{
 const sent:Record<string,string>[]=[];let now=1000000;
 const report=createErrorReporter({enabled:true,send:e=>sent.push(e),now:()=>now,route:()=>'/stock/PRIVATE?email=private@example.test',revision:'a'.repeat(40)});
 assert.equal(report('javascript'),true);assert.equal(report('javascript'),false);assert.equal(report('promise'),true);assert.equal(report('render'),true);assert.equal(report('network'),true);assert.equal(report('auth'),true);assert.equal(report('route'),false);
 now+=60000;assert.equal(report('javascript'),true);assert.equal(sent[0].route,'stock');assert.equal(JSON.stringify(sent).includes('PRIVATE'),false);assert.equal(JSON.stringify(sent).includes('email'),false);
 assert.equal(createErrorReporter({send:e=>sent.push(e)})('render'),false);assert.equal(safePage('/unknown/private'),'home');
});
test('telemetry delivery failure never retries or throws',async()=>{let calls=0;const r=createErrorReporter({enabled:true,route:()=>'/engine',send:()=>{calls++;throw Error('private');}});assert.equal(r('render'),true);assert.equal(r('render'),false);assert.equal(calls,1);});
