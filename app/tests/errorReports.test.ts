import {test} from 'node:test';import assert from 'node:assert/strict';
import {createErrorReporter,safePage,installErrorReports,classifyAppError} from '../src/lib/errorReports.js';
test('browser errors are opt-in, bounded, deduplicated and exclude sensitive content',()=>{
 const sent:Record<string,string>[]=[];let now=1000000;
 const report=createErrorReporter({enabled:true,send:e=>sent.push(e),now:()=>now,route:()=>'/stock/PRIVATE?email=private@example.test',revision:'a'.repeat(40)});
 assert.equal(report('javascript'),true);assert.equal(report('javascript'),false);assert.equal(report('promise'),true);assert.equal(report('render'),true);assert.equal(report('network'),true);assert.equal(report('auth'),true);assert.equal(report('route'),false);
 now+=60000;assert.equal(report('javascript'),true);assert.equal(sent[0].route,'stock');assert.equal(JSON.stringify(sent).includes('PRIVATE'),false);assert.equal(JSON.stringify(sent).includes('email'),false);
 assert.equal(createErrorReporter({send:e=>sent.push(e)})('render'),false);assert.equal(safePage('/unknown/private'),'home');
});
test('telemetry delivery failure never retries or throws',async()=>{let calls=0;const r=createErrorReporter({enabled:true,route:()=>'/engine',send:()=>{calls++;throw Error('private');}});assert.equal(r('render'),true);assert.equal(r('render'),false);assert.equal(calls,1);});
test('installed browser hooks respect DNT, preserve fetch failures and never recurse into telemetry',async()=>{
 const scope=globalThis as unknown as Record<string,unknown>;
 const descriptors=Object.fromEntries(['window','navigator','location'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const calls:{url:string;body?:string;credentials?:string}[]=[];
 const original=async(url:string,options?:{body?:string;credentials?:string})=>{calls.push({url,...options});if(url==='/api/fail')throw Error('private input');return new Response(null,{status:url==='/api/telemetry/errors'?204:503});};
 const fake=Object.assign(new EventTarget(),{fetch:original});
 try{
  Object.defineProperty(globalThis,'window',{value:fake,configurable:true});Object.defineProperty(globalThis,'navigator',{value:{userAgent:'Mobile Safari',doNotTrack:'1'},configurable:true});Object.defineProperty(globalThis,'location',{value:{origin:'https://continua.invalid',pathname:'/engine'},configurable:true});
  installErrorReports({enabled:true});assert.equal(fake.fetch,original);
  Object.defineProperty(globalThis,'navigator',{value:{userAgent:'Mobile Safari'},configurable:true});
  const cleanup=installErrorReports({enabled:true,revision:'a'.repeat(40)});
  fake.dispatchEvent(new Event('error'));fake.dispatchEvent(new Event('unhandledrejection'));
  await assert.rejects(fake.fetch('/api/fail'),/private input/);await fake.fetch('/api/v1/identity/session');
  const reports=calls.filter(c=>c.url==='/api/telemetry/errors');assert.equal(reports.length,4);assert.ok(reports.every(c=>c.credentials==='omit'));assert.equal(JSON.stringify(reports).includes('private input'),false);
  assert.equal(classifyAppError({message:'Failed to fetch dynamically imported module: private-url'},'render'),'route');
  cleanup();assert.equal(fake.fetch,original);
 }finally{for(const key of ['window','navigator','location']){const d=descriptors[key];if(d)Object.defineProperty(globalThis,key,d);else delete scope[key];}}
});
