import {it,expect} from 'vitest';
import {createQueryVolume} from '../src/monitoring/queryVolume.js';

it('counts results and failures without retaining SQL, rows or personal data',()=>{
 const metrics=createQueryVolume();
 metrics.record('SELECT private_email FROM private_table',{rows:[{email:'private@example.test',value:12.5}]},2);
 metrics.record('SELECT private_email FROM private_table',null,3,true);
 const snapshot=metrics.snapshot(),entry=snapshot.queries[0];
 expect(entry.calls).toBe(2);expect(entry.failures).toBe(1);expect(entry.rows).toBe(1);
 expect(entry.estimatedResultValueBytes).toBeGreaterThan(0);
 expect(JSON.stringify(snapshot)).not.toMatch(/private_email|private_table|private@example/);
 expect(snapshot.unit).toContain('not Neon');
});
it('bounds distinct statements and recursive samples',()=>{
 const metrics=createQueryVolume();
 for(let i=0;i<200;i++)metrics.record('SELECT '+i,{rows:[]},0);
 const cyclic={};cyclic.self=cyclic;
 expect(()=>metrics.record('SELECT cyclic',{rows:[cyclic]},0)).not.toThrow();
 const entries=metrics.snapshot().queries;
 expect(entries.length).toBeLessThanOrEqual(129);
 expect(entries.some(row=>row.sampleTruncations>0)).toBe(true);
});
