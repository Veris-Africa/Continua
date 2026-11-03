// Explicit operator read only: one aggregate, no document bodies/URLs or writes.
export async function ingestionStatus(database){
 try{
  const result=await database.query(`SELECT status,count(*)::int AS count,
   max(extract(epoch FROM now()-created_at))::double precision AS oldest_seconds,
   count(*) FILTER(WHERE status='processing' AND lease_until<now())::int AS expired_leases,
   count(*) FILTER(WHERE status='failed' AND attempts>=5)::int AS exhausted
   FROM scraping.document_jobs WHERE status<>'complete' GROUP BY status ORDER BY status LIMIT 10`);
  const groups=result.rows.map(r=>({status:['pending','processing','failed','complete'].includes(r.status)?r.status:'other',count:Number(r.count),oldestSeconds:Number(r.oldest_seconds)||0,expiredLeases:Number(r.expired_leases),exhausted:Number(r.exhausted)}));
  return {available:true,groups,categories:{ingestion_backlog:groups.some(r=>r.oldestSeconds>86400),ingestion_expired_leases:groups.some(r=>r.expiredLeases>0),ingestion_retry_exhausted:groups.some(r=>r.exhausted>0)},coverage:'document_jobs only; publication lateness requires issuer expected-date evidence and collector receipts'};
 }catch{return {available:false,groups:null,categories:null};}
}
