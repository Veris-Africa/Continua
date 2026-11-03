import {it,expect,vi,afterEach} from 'vitest';
import {InMemoryCache} from '../src/storage/cache.js';
import {UpstashCache} from '../src/storage/upstashCache.js';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('bounds local payloads, preserves producer responses and expires/restarts empty',async()=>{
 const c=new InMemoryCache();const huge='x'.repeat(1024*1024);
 expect(await c.getOrSet('oversized',1000,async()=>huge)).toBe(huge);expect(await c.get('oversized')).toBeNull();
 await c.set('user:A',{value:1},100);await c.set('user:B',{value:2},100);
 expect(await c.get('user:A')).toEqual({value:1});expect(await c.get('user:B')).toEqual({value:2});
 await c.del('user:A');expect(await c.get('user:A')).toBeNull();
 await new Promise(resolve=>setTimeout(resolve,180));expect(await c.get('user:B')).toBeNull();expect(await new InMemoryCache().get('user:B')).toBeNull();
});
it('does not resurrect local data on an authoritative remote miss and bounds oversized writes',async()=>{
 const request=vi.fn().mockResolvedValue({ok:true,json:async()=>({result:null})});vi.stubGlobal('fetch',request);
 const local=new InMemoryCache();await local.set('key',1);const c=new UpstashCache('https://fixture.upstash.io','fixture','stage-v1',local);
 expect(await c.get('key')).toBeNull();await c.set('key','x'.repeat(1024*1024));
 expect(await local.get('key')).toBeNull();expect(c.metrics.oversized).toBe(1);
 expect(JSON.parse(request.mock.calls.at(-1)[1].body)[0]).toBe('DEL');
});
it('keeps limiter errors fail-closed during ordinary cache fallback',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(Error('offline')));const c=new UpstashCache('https://fixture.upstash.io','fixture','stage-v1',new InMemoryCache());
 await c.set('quote',3);expect(await c.get('quote')).toBe(3);
 await expect(c.rateLimitCommand(['EVAL','script','1','counter'])).rejects.toThrow('offline');
});
