// Bounded retries for transport/service recovery only. Never turn an outage into logout.
export async function restoreAccount(restore:()=>Promise<unknown>,active:()=>boolean,sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms))) {
 for(let attempt=0;;attempt++){
  if(!active())return;
  try {await restore();return;} catch(error){
   const status=(error as {status?:number})?.status;
   const name=(error as {name?:string})?.name;
   const transient=name!=='TimeoutError'&&name!=='AbortError'&&(status==null||status===0||status===429||status===500||status===502||status===503||status===504);
   if(!transient||attempt>=2||!active())throw error;
   await sleep(attempt===0?500:1500);
  }
 }
}
