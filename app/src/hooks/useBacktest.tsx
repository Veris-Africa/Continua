import { useMutation } from "@tanstack/react-query";
import { backtestApi, type BacktestRequest } from "@/api/backtestApi";

/** Runs a strategy backtest on demand — a mutation, not a query, since a
 *  backtest is a "do this computation now" action (the user picks a
 *  strategy/params and hits Run), not data that should auto-refetch. */
export function useBacktest() {
  const mutation = useMutation({
    mutationFn: (req: BacktestRequest) => backtestApi.run(req),
  });

  return {
    runBacktest: mutation.mutate,
    runBacktestAsync: mutation.mutateAsync,
    result: mutation.data,
    isRunning: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}