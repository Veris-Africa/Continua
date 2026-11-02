const reject=(message,status=409)=>Object.assign(new Error(message),{status,code:'WATCHLIST_CONFLICT'});
export async function lockWatchlistOwner(client,userId){
 if(!/^[a-f0-9-]{36}$/i.test(userId??''))throw reject('Verified owner required',401);
 // A separate command before the read/write obtains a fresh READ COMMITTED
 // snapshot after a competing request commits. Lock lasts only this transaction.
 await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['continua-watchlist:'+userId]);
}
export async function guardWatchlistMutation(client,{resource,method,changes},claims){
 if(!['watchlists','watchlist_folders'].includes(resource)||['GET','HEAD'].includes(method))return;
 await lockWatchlistOwner(client,claims?.sub);
 const rows=Array.isArray(changes)?changes:[changes];
 for(const row of rows){
  if(row?.user_id!==undefined&&row.user_id!==claims.sub)throw reject('Watchlist ownership cannot be reassigned',403);
  if(resource==='watchlist_folders'&&method==='PATCH'&&Object.hasOwn(row??{},'is_default'))throw reject('Default-folder status cannot be edited',403);
 }
 if(resource==='watchlists'){
  const ids=[...new Set(rows.map(row=>row?.folder_id).filter(id=>id!==undefined))];
  if(ids.length){
   if(ids.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id)))throw reject('A valid owned folder is required',400);
   const owned=await client.query('SELECT id::text FROM public.watchlist_folders WHERE user_id=$1 AND id=ANY($2::uuid[])',[claims.sub,ids]);
   if(owned.rows.length!==ids.length)throw reject('A folder does not belong to this account',403);
  }
 }
 if(resource==='watchlist_folders'&&method==='POST'){
  const existing=(await client.query('SELECT id,is_default FROM public.watchlist_folders WHERE user_id=$1',[claims.sub])).rows;
  const newRows=rows.filter(row=>!existing.some(folder=>folder.id===row?.id?.toLowerCase()));
  const defaults=newRows.filter(row=>row?.is_default===true).length;
  if(defaults>1||defaults&&existing.some(row=>row.is_default))throw reject('A default watchlist already exists');
  const plan=(await client.query('SELECT public.effective_subscription_plan($1) AS plan',[claims.sub])).rows[0]?.plan;
  if(existing.length+newRows.length>(['premium','premium_plus'].includes(plan)?20:1))throw reject('Your watchlist folder limit has been reached');
 }
}
export async function ensureDefaultWatchlist(database,claims){
 const client=await database.connect();
 try{
  await client.query("BEGIN; SET LOCAL statement_timeout='8000ms'; SET LOCAL ROLE authenticated");
  await client.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify(claims)]);
  await client.query('SELECT public.continua_session_guard()');
  await lockWatchlistOwner(client,claims.sub);
  const folders=(await client.query('SELECT * FROM public.watchlist_folders WHERE user_id=$1 ORDER BY is_default DESC,created_at,id',[claims.sub])).rows;
  if(folders.filter(row=>row.is_default).length>1)throw reject('Multiple default folders require review');
  // Existing custom folders are retained. A Free account must not gain a second
  // folder merely because its first one has been renamed or lacks a default flag.
  const folder=folders[0]??(await client.query("INSERT INTO public.watchlist_folders(user_id,name,is_default,sort_order) VALUES($1,'My Watchlist',true,0) RETURNING *",[claims.sub])).rows[0];
  await client.query('COMMIT');return folder;
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
