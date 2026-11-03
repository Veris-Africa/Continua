export async function readFollowingIds(client,owner){
 const {data,error}=await client.from('user_follows').select('following_id').eq('follower_id',owner);
 if(error)throw error;
 if(!Array.isArray(data))throw Error('Following status unavailable');
 return data.map(row=>row.following_id);
}
export async function readFollowCounts(client,target){
 const [followers,following]=await Promise.all([
  client.from('user_follows').select('id',{count:'exact',head:true}).eq('following_id',target),
  client.from('user_follows').select('id',{count:'exact',head:true}).eq('follower_id',target),
 ]);
 if(followers.error||following.error)throw followers.error||following.error;
 const count=value=>Number.isSafeInteger(value)&&value>=0?value:null;
 return {followers:count(followers.count),following:count(following.count)};
}
