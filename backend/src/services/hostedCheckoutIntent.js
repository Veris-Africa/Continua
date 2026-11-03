import {createHash} from 'node:crypto';
import {ApiError} from '../api/middleware/errorHandler.js';
export function hostedIntentReference(userId,intentId){
 if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(intentId??''))throw new ApiError(400,'A fresh checkout intent is required.');
 const h=createHash('sha256').update(userId+'|'+intentId).digest('hex');
 return `continua-live-${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
}
export function hostedRequestHash(userId,email,input,policy,paymentMethod,amountMinor){
 return createHash('sha256').update(JSON.stringify([userId,email.toLowerCase(),input.plan,input.cycle,policy,paymentMethod??null,amountMinor])).digest('hex');
}
export function checkoutPending(reference){
 return Object.assign(new ApiError(409,'Checkout initialization is unconfirmed. Verify this reference before starting another payment.'),{code:'CHECKOUT_INITIALIZATION_PENDING',reference});
}
