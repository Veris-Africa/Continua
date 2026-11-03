import {readFollowingIds} from '@/lib/followQueries.js';
import { useEffect, useCallback, useMemo } from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import { supabase } from '@/integrations/continua/browserClient';
import { useAuth } from './useAuth';

export interface FollowUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  handle?: string | null;
}

// Every mounted consumer shares one account-scoped ID query. Full profiles are
// loaded only for an explicitly opened list, not to decide a Follow button.
const pending=new Set<string>();
export function useFollows() {
  const { user }=useAuth();
  const client=useQueryClient();
  const owner=user?.id;
  const key=useMemo(()=>['continua','following-ids',owner],[owner]);
  const ids=useQuery({queryKey:key,enabled:!!owner,staleTime:60_000,gcTime:5*60_000,retry:1,
    queryFn:()=>readFollowingIds(supabase,owner)});
  const followingIds=useMemo(()=>new Set<string>(ids.data??[]),[ids.data]);
  useEffect(()=>{
    if(!owner)return;
    const refresh=()=>{void client.invalidateQueries({queryKey:key});void client.invalidateQueries({queryKey:['continua','follow-counts']});};
    let channel:BroadcastChannel|null=null;
    try{if(typeof BroadcastChannel==='function')channel=new BroadcastChannel('continua-follows');}catch{/* Optional cross-tab transport. */}
    const message=(event:MessageEvent)=>{if(event.data?.owner===owner)refresh();};
    channel?.addEventListener('message',message);
    window.addEventListener('continua:community-safety-changed',refresh);
    return()=>{channel?.close();window.removeEventListener('continua:community-safety-changed',refresh);};
  },[owner,client,key]);
  const list=useCallback(async(direction:'followers'|'following',target=owner)=>{
    if(!target)return [];
    return client.fetchQuery({queryKey:['continua','follow-list',owner,target,direction],staleTime:30_000,gcTime:5*60_000,queryFn:async()=>{
      const column=direction==='followers'?'follower_id':'following_id';
      const filter=direction==='followers'?'following_id':'follower_id';
      const {data,error}=await supabase.from('user_follows').select(column).eq(filter,target);
      if(error)throw error;if(!data?.length)return [];
      const profiles=await supabase.from('profiles_public').select('id, user_id, full_name, avatar_url, bio, handle').in('user_id',data.map((row:Record<string,string>)=>row[column]));
      if(profiles.error)throw profiles.error;return (profiles.data??[]) as FollowUser[];
    }});
  },[owner,client]);
  const fetchFollowers=useCallback((target?:string)=>list('followers',target),[list]);
  const fetchFollowing=useCallback((target?:string)=>list('following',target),[list]);
  const isFollowing=useCallback((target:string):boolean|undefined=>ids.data===undefined?undefined:followingIds.has(target),[ids.data,followingIds]);
  const change=async(target:string,follow:boolean)=>{
    if(!owner||target===owner)return {error:{message:'Cannot follow this account'}};
    const lock=owner+':'+target;
    if(ids.data===undefined||pending.has(lock))return {error:{message:'Following status is still loading. Please retry.'}};
    pending.add(lock);
    try {
      await client.cancelQueries({queryKey:key});
      const result=follow?await supabase.from('user_follows').insert({follower_id:owner,following_id:target}):await supabase.from('user_follows').delete().eq('follower_id',owner).eq('following_id',target);
      if(result.error)return {error:result.error};
      // Do not resurrect private cache after logout/account switch.
      if(client.getQueryData(key)!==undefined)client.setQueryData<string[]>(key,previous=>follow?[...new Set([...(previous??[]),target])]:(previous??[]).filter(id=>id!==target));
      void client.invalidateQueries({queryKey:['continua','follow-counts']});
      void client.invalidateQueries({queryKey:['continua','follow-list']});
      try{if(typeof BroadcastChannel==='function'){const channel=new BroadcastChannel('continua-follows');try{channel.postMessage({owner});}finally{channel.close();}}}catch{/* A saved write must not appear to fail when optional messaging is unavailable. */}
      return {error:null};
    }finally{pending.delete(lock);}
  };
  return {followingIds,loading:!!owner&&ids.data===undefined,error:ids.error,isFollowing,
    followUser:(target:string)=>change(target,true),unfollowUser:(target:string)=>change(target,false),
    toggleFollow:(target:string)=>change(target,!isFollowing(target)),fetchFollowers,fetchFollowing,refetch:ids.refetch};
}
