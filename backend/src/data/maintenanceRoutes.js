import express from 'express';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import {BoundedMemoryRateStore} from '../api/middleware/sharedRateStore.js';
import {rateLimitClientIP} from '../api/middleware/edgeClientIdentity.js';
import {timingSafeEqual} from 'node:crypto';

export function createMaintenanceRouter({secret,run,database,paymentStatus,observability,ingestion}){
 const router=express.Router();let busy=false;
 router.use(rateLimit({windowMs:60000,limit:120,standardHeaders:false,legacyHeaders:false,store:new BoundedMemoryRateStore(),keyGenerator:(req,res)=>ipKeyGenerator(rateLimitClientIP(req,res))}));
 router.use((req,res,next)=>{
  res.set('Cache-Control','no-store');
  const supplied=req.header('x-continua-maintenance-key');
  if(typeof secret!=='string'||secret.length<32||secret.length>512)return res.status(503).json({error:'Maintenance is not configured'});
  if(req.header('origin')||typeof supplied!=='string'||Buffer.byteLength(supplied)!==Buffer.byteLength(secret)||!timingSafeEqual(Buffer.from(supplied),Buffer.from(secret)))return res.status(401).json({error:'Unauthorized'});
  next();
 });
 router.get('/observability',async(_req,res)=>{
  if(!observability)return res.status(404).json({error:'Observability is not configured'});
  try{return res.json(await observability());}catch{return res.status(503).json({error:'Operational status unavailable'});}
 });
 router.get('/ingestion-operations',async(_req,res)=>{
  if(!ingestion)return res.status(404).json({error:'Ingestion diagnostics are not configured'});
  try{const status=await ingestion();return res.status(status.available?200:503).json(status);}catch{return res.status(503).json({available:false});}
 });
 router.get('/payment-operations',async(_req,res)=>{
  if(!paymentStatus)return res.status(404).json({error:'Payment operations are not enabled'});
  try{return res.json(await paymentStatus());}catch{return res.status(503).json({error:'Operational status unavailable'});}
 });
 router.get('/media-cleanup',async(_req,res)=>{
  if(!database)return res.status(503).json({error:'Cleanup is not configured'});
  try{const rows=(await database.query(`SELECT q.user_id::text FROM app_identity.account_media_cleanup q WHERE completed_at IS NULL AND NOT EXISTS(SELECT 1 FROM app_identity.users u WHERE u.id=q.user_id) ORDER BY created_at LIMIT 5`)).rows;return res.json({owners:rows.map(row=>row.user_id)});}
  catch{return res.status(503).json({error:'Cleanup unavailable'});}
 });
 router.post('/media-cleanup/complete',express.json({limit:'1kb'}),async(req,res)=>{
  const owner=req.body?.owner;
  if(!database||typeof owner!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner))return res.status(400).json({error:'Invalid cleanup receipt'});
  try{await database.query('UPDATE app_identity.account_media_cleanup q SET completed_at=now() WHERE user_id=$1 AND completed_at IS NULL AND NOT EXISTS(SELECT 1 FROM app_identity.users u WHERE u.id=q.user_id)',[owner]);return res.status(204).end();}
  catch{return res.status(503).json({error:'Cleanup unavailable'});}
 });
 router.post('/application-jobs',async(req,res)=>{
  if(busy)return res.status(409).json({error:'Maintenance is already running'});
  busy=true;
  try{const result=await run({sweep:true});return res.json(result);}
  catch{return res.status(503).json({error:'Maintenance failed; retry on the next tick'});}
  finally{busy=false;}
 });
 return router;
}
