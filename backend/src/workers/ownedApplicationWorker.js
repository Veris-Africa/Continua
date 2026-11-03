import {runDurableMaintenance} from './durableMaintenance.js';
import {env} from '../config/index.js';
import {paymentOperations,kickPaymentOperations} from '../services/paymentOperationsRuntime.js';
import {runCardRenewals} from './cardRenewalWorker.js';
import {paymentOperationsStatus} from '../monitoring/paymentOperationsStatus.js';
import {query} from '../storage/db.js';
import cron from 'node-cron';
import {getIdentityRuntime} from '../auth/runtime.js';
import {runOwnedAlertSweep,expireOwnedMemberships} from '../data/alertSweep.js';
import {indicatorsService} from '../services/technical/indicatorsService.js';
import {logger} from '../monitoring/logger.js';

export async function runOwnedApplicationJobs({sweep=true}={}){
 const runtime=getIdentityRuntime();if(!runtime)return {enabled:false};
 if(env.PAYMENT_DURABILITY_ENABLED===true){
  // The existing independent scheduler wakes this service; no new timer/platform.
  await paymentOperations().seedRecovery();
  kickPaymentOperations();
  await runCardRenewals();
  await paymentOperationsStatus({query},{trackTransitions:true,report:fields=>logger.warn({component:'operational-transition',...fields},'Payment operational state changed')});
 }
 const execute=async()=>{
 await expireOwnedMemberships(runtime.database);
 const alerts=sweep?await runOwnedAlertSweep({database:runtime.database,computeIndicator:request=>indicatorsService.compute(request)}):null;
 return {enabled:true,alerts};
 };
 return env.PAYMENT_DURABILITY_ENABLED===true?runDurableMaintenance({query},execute):execute();
}
export function startOwnedApplicationWorker(){
 if(!getIdentityRuntime())return {stop(){}};
 const task=cron.schedule('0 * * * *',async()=>{
  try{const result=await runOwnedApplicationJobs({sweep:true});logger.info({component:'owned-application-jobs',...result},'Application maintenance completed');}
  catch{logger.error({component:'owned-application-jobs'},'Application maintenance failed; retry on next scheduled tick');}
 },{timezone:'UTC',noOverlap:true});
 return task;
}
