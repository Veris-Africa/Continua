import {sendAuthenticationFailure,invalidSession} from '../auth/authErrors.js';
import express from 'express';
import {rateLimit} from 'express-rate-limit';
import {protectionStore} from '../api/middleware/sharedRateStore.js';
import {checkOwnedPriceAlerts} from './priceAlerts.js';
import {deleteOwnedAccount} from './deleteAccount.js';

export function createOwnedFunctionRouter({database,verifyAccess,deleteAccount=deleteOwnedAccount}){
 const router=express.Router();

 router.use((req,res,next)=>{res.set('Cache-Control','private, no-store');next();});
 router.use(async(req,res,next)=>{
  const token=req.header('x-user-token')??req.header('authorization')?.replace(/^Bearer /,'');
  try{if(!token)throw invalidSession();res.locals.identity=await verifyAccess(token);next();}
  catch(error){return sendAuthenticationFailure(res,error);}
 });
 router.use(rateLimit({windowMs:60000,limit:120,standardHeaders:false,legacyHeaders:false,store:protectionStore('owned-functions'),passOnStoreError:false,keyGenerator:(_req,res)=>'owner:'+res.locals.identity.user.id}));
 router.post('/check-price-alerts',async(req,res)=>{
  try{const json=await checkOwnedPriceAlerts({database,identity:res.locals.identity,body:req.body});return res.type('json').send(json);}
  catch(error){const status=[400,413,503].includes(error.status)?error.status:503;return res.status(status).json({error:status===400?'Invalid alert check':status===413?'Alert check exceeds its resource limit':'Alert check is temporarily unavailable'});}
 });
 router.post('/delete-account',async(req,res)=>{
  try{return res.json(await deleteAccount({database,identity:res.locals.identity,body:req.body}));}
  catch(error){const status=[400,401,403,409].includes(error.status)?error.status:503;return res.status(status).json({error:status===503?'Account deletion is temporarily unavailable':error.message});}
 });
 // Existing policy keeps paid AI disabled. Preserve an explicit, actionable
 // response and never silently substitute fabricated research or make a call.
 router.post('/stock-thesis',(_req,res)=>res.status(503).json({error:'AI stock thesis is currently disabled',code:'PAID_AI_DISABLED'}));
 return router;
}
