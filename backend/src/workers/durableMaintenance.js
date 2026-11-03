import {randomUUID} from 'node:crypto';

// Fixed existing job, not an arbitrary browser-supplied task executor.
export async function runDurableMaintenance(database,work){
 const lease=randomUUID();
 await database.query("INSERT INTO operations.periodic_jobs(name) VALUES('application-maintenance') ON CONFLICT DO NOTHING");
 await database.query("UPDATE operations.periodic_jobs SET status='review',lease_id=NULL,lease_until=NULL,error_category='retry_exhausted' WHERE name='application-maintenance' AND attempts>=5 AND (status='retry' OR (status='processing' AND lease_until<now()))");
 const claimed=await database.query(`UPDATE operations.periodic_jobs SET status='processing',attempts=attempts+1,lease_id=$1,lease_until=now()+interval '10 minutes',last_started_at=now()
  WHERE name='application-maintenance' AND attempts<5 AND ((status IN ('idle','retry') AND next_due_at<=now()) OR (status='processing' AND lease_until<now())) RETURNING attempts`,[lease]);
 if(!claimed.rowCount)return {enabled:true,maintenance:'not-due-or-owned'};
 try{
  const result=await work();
  const completed=await database.query(`UPDATE operations.periodic_jobs SET status='idle',attempts=0,lease_id=NULL,lease_until=NULL,last_completed_at=now(),error_category=NULL,
   next_due_at=date_trunc('hour',now())+interval '1 hour' WHERE name='application-maintenance' AND lease_id=$1 AND lease_until>now() RETURNING name`,[lease]);
  return {...result,maintenance:completed.rowCount?'completed':'lease-lost'};
 }catch(error){
  const exhausted=claimed.rows[0].attempts>=5;
  await database.query(`UPDATE operations.periodic_jobs SET status=$2,lease_id=NULL,lease_until=NULL,error_category=$3,next_due_at=now()+($4::int*interval '1 minute')
   WHERE name='application-maintenance' AND lease_id=$1 AND lease_until>now()`,[lease,exhausted?'review':'retry',exhausted?'retry_exhausted':'dependency_unavailable',Math.min(60,2**claimed.rows[0].attempts)]).catch(()=>{});
  throw error;
 }
}
