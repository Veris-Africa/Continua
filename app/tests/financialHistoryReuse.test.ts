import {test} from 'node:test';
import assert from 'node:assert/strict';
import {QueryClient} from '@tanstack/react-query';
import {financialHistoryWindow} from '../src/lib/financialHistoryWindow.ts';

test('short Fundamentals and full annual views share one real query and keep the complete window',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:1800000}}});
 let calls=0;
 const rows=Array.from({length:20},(_,index)=>({fiscalYear:2005+index,revenue:123.456+index}));
 const read=async()=>{calls++;return rows;};
 try {
  const short=financialHistoryWindow('KCB','annual',10),full=financialHistoryWindow('KCB','annual',20);
  const [a,b]=await Promise.all([client.fetchQuery({...short,queryFn:read}),client.fetchQuery({...full,queryFn:read})]);
  assert.equal(calls,1);assert.deepEqual(a.slice(-10),rows.slice(-10));assert.deepEqual(b,rows);
  assert.equal(financialHistoryWindow('KCB','annual',80).fetchLimit,80);
  assert.equal(financialHistoryWindow('KCB','quarterly',10).fetchLimit,50);
  assert.equal(financialHistoryWindow('KCB','annual',101).fetchLimit,101);
 } finally {client.clear();}
});
