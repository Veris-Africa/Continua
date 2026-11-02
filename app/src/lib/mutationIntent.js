// One hook/composer instance owns one pending create intent. Successful creates
// clear it, so a genuinely separate action with identical contents gets a new ID.
export function createMutationIntent(newId=()=>crypto.randomUUID()){
 let pending;
 return {
  prepare(value,logicalIdentity=value){const fingerprint=JSON.stringify(logicalIdentity);if(!pending||pending.fingerprint!==fingerprint)pending={fingerprint,id:newId(),value:{...value}};return {...pending.value,id:pending.id};},
  confirm(id){if(pending?.id===id)pending=undefined;},
 };
}
