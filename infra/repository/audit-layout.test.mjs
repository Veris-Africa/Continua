import test from 'node:test';
import assert from 'node:assert/strict';
import {validateComponents,auditLayout} from './audit-layout.mjs';
import {componentPath,repositoryRoot} from './component-paths.mjs';
import path from 'node:path';
import {sourceHash} from './source-identity.mjs';
test('portable source identity ignores checkout line endings but preserves binary bytes and semantic edits',()=>{
 assert.equal(sourceHash(Buffer.from('a\r\nb\r\n')),sourceHash(Buffer.from('a\nb\n')));
 assert.notEqual(sourceHash(Buffer.from('a\nb')),sourceHash(Buffer.from('a\nc')));
 assert.notEqual(sourceHash(Buffer.from([0,13,10])),sourceHash(Buffer.from([0,10])));
});
test('entrypoint validation catches Linux case drift, missing consumers and duplicate ownership',()=>{
 const items=[{id:'api',path:'api',entrypoints:['main.go'],consumers:['workflow.yml']}];
 assert.deepEqual(validateComponents(items,['api/main.go','workflow.yml']),[]);
 assert.equal(validateComponents(items,['api/Main.go']).length,2);
 assert.ok(validateComponents([...items,...items],['api/main.go','workflow.yml']).some(x=>x.includes('duplicate')));
});
test('shared component resolution preserves package roots and refuses unknown/traversing paths',()=>{
 assert.equal(componentPath('api-candidate','go.mod'),path.join(repositoryRoot,'api-candidate','go.mod'));
 assert.throws(()=>componentPath('unknown','go.mod'));
 assert.throws(()=>componentPath('collector','..','backend','.env'));
});
test('real repository has canonical entrypoint coverage without freezing future source edits',()=>{
 const result=auditLayout();assert.deepEqual(result.issues,[]);assert.equal(result.mappedFiles,483);
 assert.equal(result.moveIdentityVerified,false);
});
