import {useRef} from 'react';
import {createMutationIntent} from '../lib/mutationIntent.js';
import {holdingInputError} from '../../../backend/src/data/holdingContract.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/continua/browserClient';
import { useAuth } from './useAuth';

const CACHE_PREFIX = 'continua:portfolio:';
export interface PortfolioItem {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  shares: number;
  avg_cost: number;
  sector: string | null;
  created_at: string;
  updated_at: string;
}

function readCache(userId: string): PortfolioItem[] | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CACHE_PREFIX + userId) ?? 'null');
    if (!Array.isArray(value)) return undefined;
    return value.filter((item): item is PortfolioItem => item?.user_id === userId &&
      typeof item.symbol === 'string' && Number.isFinite(item.shares) && Number.isFinite(item.avg_cost));
  } catch { return undefined; }
}
function persist(userId: string, value: PortfolioItem[]) {
  try { localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(value)); } catch { /* private browsing / quota */ }
}

/** One user-scoped cache for Home, portfolio, stock details and pull-to-refresh. */
export function usePortfolio() {
  const { user } = useAuth();
  const addIntent=useRef(createMutationIntent());
  const client = useQueryClient();
  const key = ['continua', 'portfolio', user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    initialData: () => user ? readCache(user.id) : undefined,
    initialDataUpdatedAt: 0,
    staleTime: 30_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      if (!user) return [];
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) controller.abort();
      const timer = setTimeout(abort, 8_000);
      try {
        const { data, error } = await supabase.from('portfolios').select('*')
          .eq('user_id', user.id).order('created_at', { ascending: false }).abortSignal(controller.signal);
        if (error) throw error;
        if (controller.signal.aborted) throw new Error('Portfolio request cancelled or timed out');
        persist(user.id, data ?? []);
        return (data ?? []) as PortfolioItem[];
      } finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
    },
  });

  const publish = async (update: (items: PortfolioItem[]) => PortfolioItem[]) => {
    if (!user) return;
    await client.cancelQueries({ queryKey: key });
    client.setQueryData<PortfolioItem[]>(key, (current) => {
      const next = update(current ?? []);
      persist(user.id, next);
      return next;
    });
    // Holdings edits must also refresh the Engine's private analysis and overview.
    void client.invalidateQueries({ queryKey: ['continua', 'engine-portfolio', user.id] });
    void client.invalidateQueries({ queryKey: ['continua', 'engine-portfolio-overview', user.id] });
  };

  const addToPortfolio = async (symbol: string, name: string, shares: number, avgCost: number, sector?: string) => {
    if (!user) return { error: 'User not authenticated' };
    const inputError=holdingInputError({shares,avg_cost:avgCost});
    if(!symbol.trim()||inputError)return {error:inputError??'Enter a valid symbol'};
    const intent=addIntent.current.prepare({ user_id:user.id,symbol:symbol.trim().toUpperCase(),name,shares,avg_cost:avgCost,sector });
    try {
      const { data, error } = await supabase.from('portfolios')
        .insert(intent)
        .select().single();
      if (error) return { error };
      addIntent.current.confirm(data.id);
      await publish((items) => items.some(item=>item.id===data.id)?items:[data, ...items]);
      return { data };
    } catch (error) { return { error }; }
  };
  const removeFromPortfolio = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };
    try {
      const { error } = await supabase.from('portfolios').delete().eq('id', id).eq('user_id', user.id);
      if (error) return { error };
      await publish((items) => items.filter((item) => item.id !== id));
      return { success: true };
    } catch (error) { return { error }; }
  };
  const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
    if (!user) return { error: 'User not authenticated' };
    const inputError=holdingInputError(updates,true);
    if(inputError)return {error:inputError};
    // Ownership/audit fields cannot be reassigned through this API.
    const { shares, avg_cost, symbol, name, sector } = updates;
    const previous=query.data?.find(item=>item.id===id);
    if(!previous?.updated_at)return {error:'Refresh this holding before editing it'};
    try {
      const { data, error } = await supabase.from('portfolios').update({ shares, avg_cost, symbol, name, sector })
        .eq('id', id).eq('user_id', user.id).eq('updated_at',previous.updated_at).select().single();
      if (error) return { error };
      await publish((items) => items.map((item) => item.id === id ? data : item));
      return { data };
    } catch (error) { return { error }; }
  };
  return {
    portfolio: user ? query.data ?? [] : [], loading: !!user && query.isLoading,
    error: query.error, addToPortfolio, removeFromPortfolio, updatePortfolioItem, refetch: query.refetch,
  };
}
