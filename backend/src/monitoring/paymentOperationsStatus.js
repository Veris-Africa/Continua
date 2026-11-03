// Server-only aggregate status. Never return webhook bodies, references or identities.
export async function paymentOperationsStatus(database,{report=()=>{},trackTransitions=false}={}){
 const rows=(await database.query(`SELECT kind,status,count(*)::int AS count,
  max(extract(epoch FROM now()-first_received_at))::double precision AS oldest_seconds,
  count(*) FILTER(WHERE status='processing' AND lease_until<now())::int AS expired_leases
  FROM operations.payment_work GROUP BY kind,status ORDER BY kind,status`)).rows;
 const count=predicate=>rows.filter(predicate).reduce((n,r)=>n+Number(r.count),0);
 const periodic=(await database.query("SELECT name,status,attempts,next_due_at,last_started_at,last_completed_at,lease_until FROM operations.periodic_jobs WHERE name='application-maintenance'")).rows[0]??null;
 let documents=null;
 try{documents=(await database.query(`SELECT status,count(*)::int AS count,max(extract(epoch FROM now()-created_at))::double precision AS oldest_seconds,
  count(*) FILTER(WHERE status='processing' AND lease_until<now())::int AS expired_leases,
  count(*) FILTER(WHERE status='failed' AND attempts>=5)::int AS exhausted FROM scraping.document_jobs WHERE status<>'complete' GROUP BY status ORDER BY status`)).rows;}catch{/* Explicit unavailable category; no false zero-backlog claim. */}
 const categories={payment_review:count(r=>r.status==='review')>0,
  payment_backlog:rows.some(r=>['pending','retry','processing'].includes(r.status)&&Number(r.oldest_seconds)>3600),
  payment_expired_leases:rows.some(r=>Number(r.expired_leases)>0),
  maintenance_unobserved:!periodic,maintenance_review:periodic?.status==='review',
  maintenance_overdue:!!periodic&&new Date(periodic.next_due_at).getTime()<Date.now()-7200000,
  ingestion_unavailable:documents===null,
  ingestion_backlog:documents?.some(r=>Number(r.oldest_seconds)>86400)||false,
  ingestion_retry_exhausted:documents?.some(r=>Number(r.exhausted)>0)||false,
  ingestion_expired_leases:documents?.some(r=>Number(r.expired_leases)>0)||false};
 if(trackTransitions){
  const states=Object.entries(categories).map(([category,warning])=>({category,state:warning?'warning':'clear'}));
  const changed=await database.query(`INSERT INTO operations.alert_state(category,state) SELECT category,state FROM jsonb_to_recordset($1::jsonb) AS x(category text,state text)
   ON CONFLICT(category) DO UPDATE SET state=EXCLUDED.state,changed_at=now() WHERE operations.alert_state.state IS DISTINCT FROM EXCLUDED.state RETURNING category,state`,[JSON.stringify(states)]);
  // Persisted transition suppresses repeated unchanged alerts across restarts.
  for(const row of changed.rows)report(row);
 }
 return {groups:rows,periodic,documents,categories};
}
