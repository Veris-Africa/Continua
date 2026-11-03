// One normal owned-session verification, shared with the later AuthProvider.
// No browser storage, speculative private-data reads or callback replay.
export function createSessionWarmup(restore,location=()=>globalThis.location){
 let warming;
 return {
  warm(){
   const current=location();
   if(!current||/^\/(?:auth|landing|about|help|docs|developers|trust|terms|privacy|copyright|billing-policy|features)(?:\/|$)/.test(current.pathname)||/[?&#](?:token|recovery_token|neon_auth_session_verifier)=/.test(current.search+current.hash))return false;
   if(!warming){try{warming=Promise.resolve(restore());}catch(error){warming=Promise.reject(error);}void warming.catch(()=>{});}
   return true;
  },
  restore(){const pending=warming;warming=undefined;return pending??restore();},
 };
}
