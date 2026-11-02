// Preserve one pending composer intent and its uploaded media after an ambiguous
// write. Deleting those images could damage a post that already committed.
export function createPostSubmission({insert,upload,remove,newId=()=>crypto.randomUUID()}){
 let pending;
 const same=(a,b)=>a.userId===b.userId&&a.content===b.content&&a.quotedPostId===b.quotedPostId&&JSON.stringify(a.poll??null)===JSON.stringify(b.poll??null)&&a.images.length===b.images.length&&a.images.every((v,i)=>v===b.images[i]);
 return function submit(input){
  if(input.images.length>5)return Promise.resolve({error:new Error('Maximum five images')});
  if(!pending||!same(pending.input,input))pending={input:{...input,images:[...input.images],poll:input.poll?structuredClone(input.poll):undefined},id:newId(),payload:null,submitted:false,uploaded:[],promise:null};
  const attempt=pending;input=attempt.input;if(attempt.promise)return attempt.promise;
  const job=Promise.resolve().then(async()=>{
   try{
    if(!attempt.payload){
     const urls=[];
     for(const image of input.images){const url=image.startsWith('data:')?await upload(image):image;if(image.startsWith('data:'))attempt.uploaded.push(url);urls.push(url);}
     const mentions=[...new Set(input.content.match(/\$[A-Z]+/g)?.map(s=>s.slice(1))??[])];
     attempt.payload={id:attempt.id,user_id:input.userId,content:input.content,image_url:urls[0]??null,...(urls.length?{image_urls:urls}:{}),...(input.poll?{poll:input.poll}:{}),stock_mentions:mentions.length?mentions:null,quoted_post_id:input.quotedPostId??null};
    }
    attempt.submitted=true;
    const result=await insert(attempt.payload);if(result.error)throw result.error;
    if(pending===attempt)pending=null;return result;
   }catch(error){
    if(!attempt.submitted){if(attempt.uploaded.length)await remove(attempt.uploaded).catch(()=>{});if(pending===attempt)pending=null;}
    return {error};
   }
  }).finally(()=>{attempt.promise=null;});
  attempt.promise=job;return job;
 };
}
