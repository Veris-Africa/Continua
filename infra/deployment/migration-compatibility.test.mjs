import {test} from 'node:test';import assert from 'node:assert/strict';import {migrationCompatibility,migrationInventory} from './migration-compatibility.mjs';
test('disabled application requires no optional DDL while activation fails closed without receipt',()=>{
 assert.equal(migrationCompatibility().compatible,true);assert.equal(migrationCompatibility().pending.length,4);
 assert.equal(migrationCompatibility({paymentDurability:true}).compatible,false);assert.equal(migrationCompatibility({hostedIntents:true}).compatible,false);
 assert.equal(migrationCompatibility({paymentDurability:true,applied:['phase3-payment-operations.sql']}).compatible,true);
 assert.equal(migrationInventory().length,4);assert.ok(migrationInventory().every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
});
