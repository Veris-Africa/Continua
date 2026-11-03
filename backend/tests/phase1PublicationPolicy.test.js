import {it,expect,vi} from 'vitest';
const query=vi.hoisted(()=>vi.fn());
vi.mock('../src/storage/db.js',()=>({query}));
import {publicationPolicy} from '../src/services/research/publicationPolicy.js';
it('reads current policy every time, returns only a digest and fails closed on dependency outage',async()=>{
 query.mockResolvedValueOnce({rows:[{revision:'a'.repeat(32)}]}).mockResolvedValueOnce({rows:[{revision:'b'.repeat(32)}]}).mockRejectedValueOnce(Error('connection with sensitive details'));
 expect(await publicationPolicy.revision()).toBe('a'.repeat(32));expect(await publicationPolicy.revision()).toBe('b'.repeat(32));
 await expect(publicationPolicy.revision()).rejects.toMatchObject({status:503,message:'Research publication permissions could not be verified'});
 expect(query).toHaveBeenCalledTimes(3);
});
