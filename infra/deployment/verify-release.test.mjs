import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateRelease,observeRelease,proveBackendEquivalence} from './verify-release.mjs';
test('detects backend drift without inferring deployment from main',()=>{const sha='a'.repeat(40);const r=validateRelease({frontend:{status:200,revision:sha},backend:{status:200,revision:'b'.repeat(40),schemaContract:'existing-additive-20261102'}},sha);assert.equal(r.ok,false);assert.deepEqual(r.issues,['backend_revision_mismatch']);});
test('accepts matching compatible revisions and fails missing/invalid metadata',async()=>{const sha='a'.repeat(40);const r=await observeRelease(async url=>Response.json({revision:sha,...(url.includes('onrender')?{schemaContract:'existing-additive-20261102'}:{})}));assert.equal(validateRelease(r,sha).ok,true);assert.equal(validateRelease(await observeRelease(async()=>{throw Error('private connection');}),sha).ok,false);assert.throws(()=>validateRelease({},'main'));});
test('accepts different backend SHA only with independently matching backend trees',async()=>{
 const expected='a'.repeat(40),observed='b'.repeat(40),tree='c'.repeat(40);
 const receipt=()=>({frontend:{status:200,revision:expected},backend:{status:200,revision:observed,schemaContract:'existing-additive-20261102'}});
 const same=await proveBackendEquivalence(receipt(),expected,{request:async()=>Response.json({tree:[{path:'backend',type:'tree',sha:tree}]}),token:undefined});assert.equal(validateRelease(same,expected).ok,true);assert.equal(same.backend.revision,observed);
 const different=await proveBackendEquivalence(receipt(),expected,{request:async url=>Response.json({tree:[{path:'backend',type:'tree',sha:url.endsWith(expected)?tree:'d'.repeat(40)}]})});assert.equal(validateRelease(different,expected).ok,false);
 assert.equal(validateRelease(await proveBackendEquivalence(receipt(),expected,{request:async()=>{throw Error('offline');}}),expected).ok,false);
});
