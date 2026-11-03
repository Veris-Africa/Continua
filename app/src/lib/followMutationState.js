// Shared, memory-only intent. Only acknowledged query data decides following.
export function createFollowMutationState(){
 const pending=new Map(),failed=new Set(),listeners=new Set();let version=0;
 const key=(owner,target)=>owner+':'+target;
 const emit=()=>{version++;for(const listener of listeners)listener();};
 return {
  subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},snapshot:()=>version,
  begin(owner,target,follow){const id=key(owner,target);if(pending.has(id)||pending.size>=100)return false;pending.set(id,follow);failed.delete(id);emit();return true;},
  finish(owner,target,error=false){const id=key(owner,target);pending.delete(id);if(error){if(failed.size>=500)failed.delete(failed.values().next().value);failed.add(id);}else failed.delete(id);emit();},
  state(owner,target,following){const id=key(owner,target);if(pending.has(id))return pending.get(id)?'pending-follow':'pending-unfollow';if(failed.has(id))return 'failed';return following===undefined?'unknown':following?'following':'not-following';},
  clear(){pending.clear();failed.clear();emit();},
 };
}
