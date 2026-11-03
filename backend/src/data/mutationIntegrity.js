const conflict=()=>Object.assign(new Error('This operation key belongs to a different request. Refresh before retrying.'),{status:409,code:'MUTATION_CONFLICT'});
const quote=value=>'"'+value.replaceAll('"','""')+'"';
// A client-generated row UUID is the durable create intent. No response cache,
// extra private-data table or content-based deduplication is introduced.
export async function replayOwnedCreate(client,compiled,claims){
 const {resource,method,changes}=compiled;
 if(method!=='POST'||!['posts','portfolios','watchlist_folders'].includes(resource)||!changes||Array.isArray(changes)||changes.id===undefined)return null;
 if(!/^[a-f0-9-]{36}$/i.test(changes.id)||!claims?.sub||changes.user_id!==claims.sub)throw conflict();
 await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`continua-create:${resource}:${claims.sub}:${changes.id}`]);
 const keys=Object.keys(changes),values=keys.map(key=>changes[key]);
 // Column identifiers have already passed the static resource compiler contract.
 const same=keys.map((key,i)=>`${quote(key)} IS NOT DISTINCT FROM $${i+1}`).join(' AND ');
 const result=await client.query(`SELECT (${same}) AS matches FROM public.${quote(resource)} existing WHERE id=$${values.length+1} AND user_id=$${values.length+2} FOR UPDATE`,[...values,changes.id,claims.sub]);
 if(!result.rows.length)return null;
 if(!result.rows[0].matches)throw conflict();
 // For non-representation mutations preserve the ordinary minimal response.
 const payload=compiled.representation?(await client.query(`SELECT row_to_json(projected)::text AS payload FROM (SELECT ${compiled.selectionSQL??'*'} FROM public.${quote(resource)} WHERE id=$1 AND user_id=$2) projected`,[changes.id,claims.sub])).rows[0].payload:'{"affected":1}';
 return {rows:[{payload,oversized:false}]};
}
