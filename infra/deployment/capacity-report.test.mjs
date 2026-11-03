import {test} from 'node:test';import assert from 'node:assert/strict';import {capacityReport} from './capacity-report.mjs';
test('capacity distinguishes billed receipts, interval growth, stale samples and reset periods',()=>{
 const now=Date.now(),p={source:'neon-console',observedAt:new Date(now).toISOString(),period:'2026-11',transferBytes:80,allowanceBytes:100,previous:{period:'2026-11',observedAt:new Date(now-3600000).toISOString(),transferBytes:70}};
 const r=capacityReport(p,now);assert.equal(r.usedPercent,80);assert.equal(r.bytesPerHour,10);assert.equal(r.hoursUntilAllowance,2);
 assert.equal(capacityReport({...p,source:'sql-estimate'},now).usedPercent,null);
 assert.equal(capacityReport(p,now+27*3600000).usedPercent,null);
 assert.equal(capacityReport({...p,previous:{...p.previous,period:'2026-10'}},now).bytesPerHour,null);
});
