import {query} from '../storage/db.js';
import {verifyNativeCheckout} from './paystackNative.js';
import {verifyLiveCheckout} from './paystackLive.js';
import {createPaymentOperations} from './paymentOperations.js';
import {logger} from '../monitoring/logger.js';
let operations,pending;
export function paymentOperations(){
 return operations??=createPaymentOperations({database:{query},verifyNative:verifyNativeCheckout,verifyHosted:verifyLiveCheckout});
}
// Only a latency optimization. The durable receipt/lease survives loss of this task.
export function kickPaymentOperations(){
 if(pending)return pending;
 pending=paymentOperations().drain({limit:5}).then(result=>{
  if(result.claimed)logger.info({component:'payment-operations',...result},'Payment verification work completed');
 }).catch(()=>logger.warn({component:'payment-operations',category:'dependency_unavailable'},'Payment work retained for the next independent wake-up')).finally(()=>{pending=undefined;});
 return pending;
}
