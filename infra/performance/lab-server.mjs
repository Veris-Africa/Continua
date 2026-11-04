// Offline-only production-bundle fixture. Never forwards requests or reads credentials.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {populatedFixture} from './lab-fixtures.mjs';
const root=resolve(process.env.LAB_DIST_DIR??'app/dist'), port=Number(process.env.LAB_PORT??5185);
const owner='11111111-1111-4111-8111-111111111111';
const profile={id:owner,user_id:owner,full_name:'Synthetic Investor',handle:'lab_investor',subscription_plan:'free',tradershub_onboarded:true,followers_count:3,following_count:2,portfolio_public:false,created_at:'2026-01-01T00:00:00Z'};
const requests=[];
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 const json=(status,value,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});res.end(req.method==='HEAD'?undefined:JSON.stringify(value));};
 if(url.pathname==='/__lab/requests')return json(200,requests);
 if(url.pathname==='/__lab/timing.js'&&process.env.LAB_TIMING==='true'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});return res.end(await readFile(resolve('infra/performance/lab-timing.js')));}
 if(url.pathname.startsWith('/api/')){
  requests.push({path:url.pathname,method:req.method,at:Date.now()});
  if(url.pathname==='/api/v1/identity/session'){
   if(req.method!=='GET')return json(405,{});
   await new Promise(r=>setTimeout(r,Number(process.env.LAB_AUTH_DELAY_MS??2000)));
   if(process.env.LAB_AUTH_OUTAGE==='true')return json(503,{error:'Synthetic identity outage'});
   const expires=Math.floor(Date.now()/1000)+3600;
   const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner,aal:'aal1',exp:expires})).toString('base64url')+'.synthetic';
   return json(200,{session:{user:{id:owner,email:'investor@example.invalid'},access_token:token,refresh_token:'cookie-session',expires_at:expires}});
  }
  if(process.env.LAB_POPULATED==='true')return populatedFixture(req,url,json);
  if(req.method!=='GET'&&req.method!=='HEAD')return json(403,{error:'Lab mutations disabled'});
  if(url.pathname==='/api/v1/data/profiles')return json(200,req.headers.accept?.includes('vnd.pgrst')?profile:[profile]);
  if(url.pathname==='/api/v1/data/profiles_public')return json(200,[profile]);
  if(url.pathname.startsWith('/api/v1/data/'))return json(200,[]);
  return json(404,{error:'No synthetic fixture for this route'});
 }
 const path=resolve(root,'.'+decodeURIComponent(url.pathname));
 if(path!==root&&!path.startsWith(root+sep))return json(403,{});
 try{
  const file=extname(path)?path:resolve(root,'index.html');
  let bytes=await readFile(file);
  if(process.env.LAB_TIMING==='true'&&extname(file)==='.html')bytes=Buffer.from(bytes.toString('utf8').replace('</head>','<script defer src="/__lab/timing.js" data-populated="' + (process.env.LAB_POPULATED==='true'?'true':'false') + '"></script></head>'));
  // Only populated QA responses rewrite the configured market origin. The
  // ordinary production build and comparable empty-account lab stay untouched.
  if(process.env.LAB_POPULATED==='true'&&extname(file)==='.js')bytes=Buffer.from(bytes.toString('utf8').replaceAll('https://continua-backend.onrender.com/api/v1',`http://127.0.0.1:${port}/api/v1`));
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-store':'public,max-age=3600','Content-Security-Policy':"connect-src 'self'; img-src 'self' data: blob:; font-src 'self';"});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`Offline fixture http://127.0.0.1:${port}; no network forwarding; ${process.env.LAB_POPULATED==='true'?'synthetic follow writes only':'mutations denied'}`));
