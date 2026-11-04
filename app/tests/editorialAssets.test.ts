import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('original editorial assets remain static, bounded and free of executable or external content',()=>{
 let bytes=0;
 for(const name of ['research-companion','watchlist-garden','shared-perspectives']){
  const file=readFileSync(new URL('../public/illustrations/'+name+'.svg',import.meta.url),'utf8');
  bytes+=Buffer.byteLength(file);
  assert.ok(Buffer.byteLength(file)<4096);
  assert.match(file,/viewBox="0 0 320 220"/);
  assert.doesNotMatch(file,/<(?:script|foreignObject|image|animate|set)\b|\bon\w+\s*=|\b(?:href|xlink:href)\s*=|<!ENTITY/i);
 }
 assert.ok(bytes<8192,'All three assets must remain below 8 KiB uncompressed');
});
