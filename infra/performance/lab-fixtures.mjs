// Synthetic browser acceptance data only; never imported by application runtime.
export const owner='11111111-1111-4111-8111-111111111111';
export const peer='22222222-2222-4222-8222-222222222222';
const stamp='2026-01-01T00:00:00Z';
export const profiles=[owner,peer].map((id,i)=>({id,user_id:id,full_name:i?'Synthetic Peer':'Synthetic Investor',handle:i?'lab_peer':'lab_investor',avatar_url:null,banner_url:null,bio:'Offline acceptance fixture',subscription_plan:'free',tradershub_onboarded:true,interests:[],portfolio_public:false,followers_count:0,following_count:0,created_at:stamp,updated_at:stamp}));
if(['premium','premium_plus'].includes(process.env.LAB_PLAN))profiles[0].subscription_plan=process.env.LAB_PLAN;
const follows=[{follower_id:owner,following_id:peer}];
const post={id:'33333333-3333-4333-8333-333333333333',user_id:peer,content:'Synthetic community post. $KCB',image_url:null,image_urls:[],stock_mentions:['KCB'],created_at:stamp,updated_at:stamp,author:profiles[1],likes_count:0,reposts_count:0,comments_count:0,is_liked:false,is_reposted:false,is_bookmarked:false,reaction_counts:{},my_reaction:null};
export async function populatedFixture(req,url,json){
 const path=url.pathname;
 const table=path.split('/').at(-1);
 const selection=rows=>rows.filter(row=>[...url.searchParams].every(([key,value])=>{
  if(value.startsWith('eq.'))return String(row[key])===value.slice(3);
  if(value.startsWith('neq.'))return String(row[key])!==value.slice(4);
  if(value.startsWith('in.(')){try{return JSON.parse('['+value.slice(4,-1)+']').includes(row[key]);}catch{return false;}}
  return true;
 }));
 if(path.startsWith('/api/v1/data/')){
  if(table==='user_follows'){
   if(req.method==='POST'){
    let text='';for await(const chunk of req){text+=chunk;if(text.length>2048)return json(413,{});}
    const body=JSON.parse(text);
    if(body.follower_id!==owner||body.following_id!==peer)return json(403,{message:'Fixture ownership guard'});
    if(!follows.some(row=>row.follower_id===owner&&row.following_id===peer))follows.push(body);
    return json(201,[]);
   }
   if(req.method==='DELETE'){
    if(url.searchParams.get('follower_id')!=='eq.'+owner||url.searchParams.get('following_id')!=='eq.'+peer)return json(403,{message:'Fixture ownership guard'});
    const index=follows.findIndex(row=>row.follower_id===owner&&row.following_id===peer);if(index>=0)follows.splice(index,1);return json(200,[]);
   }
   const rows=selection(follows);return json(200,req.method==='HEAD'?null:rows,{'Content-Range':'*/'+rows.length});
  }
  if(!['GET','HEAD'].includes(req.method))return json(403,{message:'Fixture mutation disabled'});
  if(table==='profiles'||table==='profiles_public'){
   const rows=selection(profiles);return json(200,req.headers.accept?.includes('vnd.pgrst')?rows[0]??null:rows);
  }
  if(table==='portfolio_history'){
   const today=new Date(),rows=Array.from({length:8},(_,index)=>({date:new Date(today.getTime()-(7-index)*86400000).toISOString().slice(0,10),value:300+index*2,cost:300,basis:'recorded_portfolio_snapshot'}));
   return json(200,rows);
  }
  if(table==='community_feed')return json(200,url.searchParams.get('author')&&url.searchParams.get('author')!==peer?[]:[post]);
  if(table==='posts')return json(200,selection([post]));
  if(table==='portfolios'){
   if(url.searchParams.get('user_id')==='eq.'+peer)return json(403,{message:'Private fixture portfolio'});
   return json(200,[{id:'fixture-holding',user_id:owner,symbol:'KCB',name:'Synthetic KCB fixture',shares:10,avg_cost:30,sector:'Banking',created_at:stamp,updated_at:stamp}]);
  }
  return json(200,[],{'Content-Range':'*/0'});
 }
 if(path==='/api/v1/instruments')return json(200,{data:[{id:'NSE:KCB',symbol:'KCB',exchange:'NSE',name:'Synthetic KCB fixture',companyName:'Synthetic KCB fixture',currency:'KES',sector:'Banking',status:'active',type:'stock'}]});
 if(path.startsWith('/api/v1/quotes')){
  const symbols=(url.searchParams.get('symbols')??'KCB').split(',');
  const rows=symbols.map(symbol=>({symbol,securityId:'NSE:'+symbol,exchange:'NSE',lastPrice:50,previousClose:49,change:1,changePercent:2.04,volume:10000,currency:'KES',status:'active',timestamp:new Date().toISOString(),source:'synthetic'}));
  return json(200,{data:path==='/api/v1/quotes'?rows:rows[0]});
 }
 if(path.startsWith('/api/v1/historical/'))return json(200,{data:Array.from({length:90},(_,i)=>({date:new Date(Date.now()-(89-i)*86400000).toISOString().slice(0,10),timestamp:new Date(Date.now()-(89-i)*86400000).toISOString(),open:40+i/10,high:41+i/10,low:39+i/10,close:40+i/10,volume:1000}))});
 if(path.startsWith('/api/v1/financials/')&&path.endsWith('/history'))return json(200,{data:[2024,2025].map(fiscalYear=>({fiscalYear,fiscalQuarter:null,reportedAt:`${fiscalYear+1}-03-01`,revenue:1000000,netIncome:100000,eps:1,sharesOutstanding:100000,totalAssets:4000000,totalLiabilities:1000000,totalEquity:3000000,operatingCashFlow:350000,freeCashFlow:200000}))});
 return json(404,{error:'Synthetic route unavailable'});
}
