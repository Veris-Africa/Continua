import {SingleObservation} from '@/components/shared/SingleObservation';
import { RollingNumber } from "@/components/shared/RollingNumber";
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import {Suspense} from 'react';
import {lazyWithRetry} from '@/lib/lazyWithRetry';
const HomeHistoryPlot=lazyWithRetry(()=>import('./HomeHistoryPlot'));
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';
import { computePortfolioStats } from '@/lib/stockPrices';
import { chartTimeScrubIndex } from '@/lib/chartScrub';

const periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
const money = value => `KES ${Math.abs(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function HomePortfolioOverview({ portfolio, quotes, visible, onToggle }) {
  const [period, setPeriod] = useState('1M');
  const [inspected, setInspected] = useState(null);
  const gradient = useId().replace(/:/g, '');
  const mapped = Object.fromEntries(Object.values(quotes).map(q => [q.symbol.toUpperCase(), { price: q.lastPrice, dayChangeAbs: q.change }]));
  const stats = computePortfolioStats(portfolio, mapped);
  const { points, state, isLoading,error:historyError,refetch:retryHistory } = usePortfolioHistory(portfolio, period,visible);
  const covered = state.kind==='point'||state.kind==='series';
  const displayValue = inspected?.value ?? stats.totalValue;
  const displayCost=inspected?.cost??stats.totalCost;
  const displayGain = displayValue - displayCost;
  const displayPct = displayCost > 0 ? displayGain / displayCost * 100 : 0;
  const color = (points.at(-1)?.value ?? 0) >= (points[0]?.value ?? 0) ? 'hsl(var(--bull))' : 'hsl(var(--bear))';
  const inspectPointer = event => {
    if (!visible || !covered) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = points[chartTimeScrubIndex(event.clientX, rect.left, rect.width, points.map(point=>point.timestamp), 42)];
    if (point) setInspected(point);
  };
  const ready = portfolio.length > 0 && stats.isFullyPriced;
  const signedMoney = value => `${value >= 0 ? '+' : '−'}${money(value)}`;
  const metric = (value, percentage) => visible ? <><RollingNumber value={signedMoney(value)}/><small>{percentage >= 0 ? '+' : ''}<RollingNumber value={percentage.toFixed(2)}/>%</small></> : '••••••';
  return <section className="home-portfolio" aria-label="Portfolio overview">
    <div className="home-portfolio-heading">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">Portfolio Value<button type="button" aria-label={visible ? 'Hide portfolio values' : 'Show portfolio values'} aria-pressed={!visible} className="grid h-9 w-9 place-items-center" onClick={onToggle}>{visible ? <Eye size={16}/> : <EyeOff size={16}/>}</button></div>
      <div className="home-periods" aria-label="Portfolio chart timeframe">{periods.map(p => <button key={p} type="button" aria-pressed={period === p} onClick={() => {setPeriod(p); setInspected(null);}}>{p === 'ALL' ? 'All' : p}</button>)}</div>
    </div>
    <p className="home-portfolio-value">{!visible ? '••••••' : ready ? <RollingNumber value={money(displayValue)}/> : portfolio.length ? 'Awaiting prices' : 'KES 0.00'}</p>
    <p className={`home-portfolio-return ${displayGain >= 0 ? 'text-bull' : 'text-bear'}`}>{ready ? visible ? <>{displayGain >= 0 ? '↗' : '↘'} <RollingNumber value={signedMoney(displayGain)}/> (<RollingNumber value={`${displayPct >= 0 ? '+' : ''}${displayPct.toFixed(2)}%`}/>){inspected && <span> · {new Date(inspected.timestamp).toLocaleDateString('en-KE',{timeZone:'Africa/Nairobi'})}</span>}</> : '••••••' : portfolio.length ? `${stats.pricedCount}/${portfolio.length} holdings priced` : 'Add your first holding to track your portfolio'}</p>
    <div className="home-portfolio-chart relative touch-none select-none" onPointerDown={event => {if(!visible||!covered||points.length<2||event.target.closest('button,a,input,select,textarea,[role="button"]'))return;event.currentTarget.setPointerCapture(event.pointerId); inspectPointer(event);}} onPointerMove={inspectPointer} onPointerUp={event => {if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);setInspected(null);}} onPointerCancel={() => setInspected(null)} onPointerLeave={event => {if(!event.currentTarget.hasPointerCapture(event.pointerId))setInspected(null);}}>
      {inspected && visible && covered && points.length>1 && <div aria-hidden="true" className="pointer-events-none absolute top-4 bottom-7 z-10 w-px bg-muted-foreground/50" style={{left: 'calc((100% - 42px) * '+((inspected.timestamp-points[0].timestamp)/Math.max(1,points.at(-1).timestamp-points[0].timestamp))+')'}}/>}
      {!visible ? <p>Portfolio chart hidden</p> : isLoading ? <p role="status">Loading recorded valuations…</p> : state.kind==='point'?<SingleObservation date={points[0].date} valueLabel={money(points[0].value)}/>: covered ? <Suspense fallback={<div role="status" className="h-[180px] rounded bg-muted motion-safe:animate-pulse" aria-label="Opening chart" />}><HomeHistoryPlot points={points} gradient={gradient} color={color} inspected={inspected}/></Suspense> : <div className="history-message" role={state.kind==='error'?'alert':'status'}><p>{state.message}</p>{historyError&&<button type="button" className="text-primary underline" onClick={()=>void retryHistory()}>Retry history</button>}</div>}

    </div>
    <div className="home-portfolio-metrics"><div><span>Day change</span><strong className={stats.todayGain >= 0 ? 'text-bull' : 'text-bear'}>{ready ? metric(stats.todayGain, stats.todayPct) : '—'}</strong></div><div><span>Total return</span><strong className={stats.totalGain >= 0 ? 'text-bull' : 'text-bear'}>{ready ? metric(stats.totalGain, stats.gainPct) : '—'}</strong></div><Link to="/track-investments"><span>Holdings</span><strong><RollingNumber value={portfolio.length}/> <ChevronRight size={15}/></strong></Link></div>
    {visible&&covered&&<p className="text-xs text-muted-foreground">{state.message}{state.refreshError&&<> Refresh failed; showing the last recorded observations. <button type="button" className="underline" onClick={()=>void retryHistory()}>Retry history</button></>}</p>}
  </section>;
}
