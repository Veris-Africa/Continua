import {it,expect,vi} from 'vitest';
import {invalidSession,authenticationFailure,unavailableAuth} from '../src/auth/authErrors.js';
import {createManagedAccessVerifier} from '../src/auth/managedVerifier.js';
const subject='neon-subject',id='11111111-1111-4111-8111-111111111111';
const row={id,subject,session_id:'binding',managed_session_id:'provider-session',cookie_ciphertext:'sealed'};
function fixture({database,readLiveSession}={}){
 return createManagedAccessVerifier({database:database??{query:vi.fn().mockResolvedValue({rows:[row],rowCount:1})},verifyJwt:async()=>({sub:subject}),vault:{open:()=> 'opaque-cookie'},issuer:'https://managed.fixture.invalid',readLiveSession:readLiveSession??(async()=>({session:{id:'provider-session',expiresAt:new Date(Date.now()+60000).toISOString()},user:{id:subject,emailVerified:true}}))});
}
it('separates invalid signatures/revocation from dependency errors without leaking details',()=>{
 expect(authenticationFailure({code:'ERR_JWS_SIGNATURE_VERIFICATION_FAILED'}).status).toBe(401);
 expect(authenticationFailure({code:'PASSWORD_CHANGED'}).status).toBe(401);
 const unavailable=authenticationFailure(Error('private connection string or provider response'));
 expect(unavailable.status).toBe(503);expect(unavailable.message).not.toContain('private');
 expect(authenticationFailure(invalidSession()).code).toBe('AUTH_INVALID');
});
it('denies SQL and provider outages as 503 instead of asserting revocation',async()=>{
 await expect(fixture({database:{query:vi.fn().mockRejectedValue(Error('sql offline'))}})('token')).rejects.toMatchObject({status:503,code:'AUTH_UNAVAILABLE'});
 await expect(fixture({readLiveSession:async()=>{throw unavailableAuth();}})('token')).rejects.toMatchObject({status:503});
});
it('retains 401 for unbound/revoked sessions and 403 for missing recent authentication',async()=>{
 await expect(fixture({database:{query:vi.fn().mockResolvedValue({rows:[]})}})('token')).rejects.toMatchObject({status:401});
 await expect(fixture({readLiveSession:async()=>null})('token')).rejects.toMatchObject({status:401});
 await expect(fixture()('token',{recent:true})).rejects.toMatchObject({status:403,code:'AUTH_RECENT_REQUIRED'});
});
