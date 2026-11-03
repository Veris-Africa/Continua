import {DataRequestError,executeDataRequest} from './browserData.js';
// Recorded values only. Current holdings cannot establish historic ownership.
export function portfolioHistoryQuery(owner,search,now=new Date()){
 if(!owner)throw new DataRequestError('Sign in to continue',401);
 if([...search.keys()].some(key=>!['from','to'].includes(key))||[...search.keys()].some(key=>search.getAll(key).length!==1))throw new DataRequestError('Invalid history filters');
 const today=now.toISOString().slice(0,10),from=search.get('from')??'2015-01-01',to=search.get('to')??today;
 const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 if(!valid(from)||!valid(to)||from>to||to>today||Date.parse(to)-Date.parse(from)>36525*86400000)throw new DataRequestError('Invalid history range');
 return {head:false,mutation:false,params:[owner,from,to],sql:`SELECT row_to_json(observation)::text payload FROM (
  SELECT DISTINCT ON(snapshot_date) to_char(snapshot_date,'YYYY-MM-DD') AS date,
   total_value AS value,total_cost AS cost,'recorded_portfolio_snapshot'::text AS basis
  FROM public.portfolio_snapshots WHERE user_id=$1 AND snapshot_date BETWEEN $2::date AND $3::date
   AND snapshot_date<=CURRENT_DATE AND total_value>=0 AND total_cost>=0
  ORDER BY snapshot_date,created_at DESC,id DESC LIMIT 1001
 ) observation ORDER BY date`};
}
export function readPortfolioHistory(database,claims,search){return executeDataRequest(database,portfolioHistoryQuery(claims.sub,search),claims);}
