import test from 'node:test';
import assert from 'node:assert/strict';
import {priceWindow,normalizePriceHistory,chartCoverage} from '../src/lib/priceHistory.ts';
import {marketDate,observationDate} from '../../backend/src/domain/marketDate.js';
import {portfolioHistoryState} from '../src/lib/portfolioHistoryState.js';
import {recordedPortfolioHistory} from '../src/lib/recordedPortfolioHistory.js';
import {cachedPriceHistory} from '../src/lib/cachedPriceHistory.js';

test('Nairobi midnight changes date windows together; short windows count calendar dates, not inferred sessions',()=>{
 const before=new Date('2026-11-03T20:59:59Z'),after=new Date('2026-11-03T21:00:00Z');
 assert.equal(marketDate(before),'2026-11-03');assert.equal(marketDate(after),'2026-11-04');
 assert.deepEqual(priceWindow('1W',before),{from:'2026-10-28',to:'2026-11-03'});
 assert.deepEqual(priceWindow('1W',after),{from:'2026-10-29',to:'2026-11-04'});
 assert.deepEqual(priceWindow('1D',after),{from:'2026-11-04',to:'2026-11-04'});
 for(const [range,dates]of [['1M',30],['3M',90],['1Y',366]] as const){const w=priceWindow(range,after);assert.equal((Date.parse(w.to)-Date.parse(w.from))/86400000+1,dates);}
 assert.equal(priceWindow('ALL',after).from,'2015-01-01');
});
test('publisher date labels remain literal while timestamp-only records use Nairobi and reject invalid or ambiguous dates',()=>{
 assert.equal(observationDate({date:'2026-11-03',timestamp:'2026-11-03T23:00:00Z'}),'2026-11-03');
 assert.equal(observationDate({timestamp:'2026-11-03T23:00:00Z'}),'2026-11-04');
 assert.equal(observationDate({timestamp:'2026-02-30T01:00:00Z'}),null);
 assert.equal(observationDate({timestamp:'2026-11-03T23:00:00'}),null);
});
test('older genuine history can cover 3M while the latest calendar week is empty',()=>{
 const now=new Date('2026-11-03T12:00:00Z'),rows=[{date:'2026-10-22',close:32},{date:'2026-10-23',close:33}];
 const long=normalizePriceHistory([],rows,'3M',now),week=normalizePriceHistory([],rows,'1W',now);
 assert.equal(long.length,2);assert.equal(chartCoverage(long,'3M','area',now).available,true);
 assert.equal(week.length,0);assert.match(chartCoverage(week,'1W','area',now).reason,/No recorded prices/);
 assert.equal(chartCoverage(long,'1W','area',now).available,false);
});
test('weekends and an absent Kenyan holiday observation do not impose a fabricated minimum session count',()=>{
 const now=new Date('2026-10-22T12:00:00Z');
 const points=normalizePriceHistory([], [{date:'2026-10-19',close:10},{date:'2026-10-21',close:11}], '1W',now);
 assert.deepEqual(points.map(p=>p.date),['2026-10-19','2026-10-21']);
 assert.equal(chartCoverage(points,'1W','line',now).available,true);
});
test('one real daily close is point-only; it cannot become OHLC, an intraday path or an invented second point',()=>{
 const now=new Date('2026-11-03T12:00:00Z'),points=normalizePriceHistory([],[{date:'2026-11-03',close:12}],'1D',now);
 assert.equal(points.length,1);assert.equal(chartCoverage(points,'1D','line',now).pointOnly,true);
 assert.equal(chartCoverage(points,'1D','candle',now).available,false);
 assert.equal(chartCoverage([], '1D','line',now).available,false);
});
test('null rows, exact duplicates and conflicting same-day closes never create financial observations',()=>{
 const rows=[null,{date:'2026-11-03',close:12},{date:'2026-11-03',close:12}] as any;
 assert.equal(normalizePriceHistory([],rows,'ALL',new Date('2026-11-03')).length,1);
 assert.equal(normalizePriceHistory([], [...rows,{date:'2026-11-03',close:13}], 'ALL',new Date('2026-11-03')).length,0);
});
test('shared portfolio states distinguish loading, failed reads, empty reads, one point, valid history and long gaps',()=>{
 assert.equal(portfolioHistoryState({pending:true}).kind,'loading');
 assert.equal(portfolioHistoryState({error:new Error('503')}).kind,'error');
 assert.equal(portfolioHistoryState({points:[]}).kind,'empty');
 const points=[{date:'2026-11-02',timestamp:Date.parse('2026-11-02'),value:100,cost:90},{date:'2026-11-03',timestamp:Date.parse('2026-11-03'),value:101,cost:90}];
 assert.equal(portfolioHistoryState({points:points.slice(0,1)}).kind,'point');
 assert.equal(portfolioHistoryState({points,error:new Error('503')}).kind,'series');
 assert.equal(portfolioHistoryState({points,error:new Error('503')}).refreshError,true);
 assert.equal(portfolioHistoryState({points:[{...points[0],timestamp:Date.parse('2026-10-01')},points[1]]}).kind,'insufficient');
 assert.equal(portfolioHistoryState({error:new Error('503')}).message.includes('No portfolio history'),false);
 assert.equal(portfolioHistoryState({points,enabled:false}).kind,'disabled');
});
test('blank, boolean and null snapshot values never silently become zero; a recorded zero remains legitimate',()=>{
 const base={date:'2026-11-03',value:0,cost:0,basis:'recorded_portfolio_snapshot'},range={from:'2026-11-01',to:'2026-11-03'};
 assert.equal(recordedPortfolioHistory([base],range).length,1);
 for(const value of ['',false,null,undefined,'NaN',Infinity])assert.equal(recordedPortfolioHistory([{...base,value}],range).length,0);
});
test('a stale range cache cannot manufacture weekly coverage from last month, but retains real overlapping points',()=>{
 const points=normalizePriceHistory([],[{date:'2026-10-23',close:12},{date:'2026-11-02',close:13}],'ALL',new Date('2026-11-03'));
 const range={from:'2026-10-28',to:'2026-11-03'};
 assert.equal(cachedPriceHistory(points.slice(0,1),range),undefined);
 assert.deepEqual(cachedPriceHistory(points,range)?.map(p=>p.date),['2026-11-02']);
});
test('contradictory canonical candles on the same date are withheld independently of input order',()=>{
 const first={timestamp:'2026-11-03T00:00:00Z',open:10,high:13,low:9,close:12,volume:100};
 const second={...first,close:11};
 const now=new Date('2026-11-03T12:00:00Z');
 assert.equal(normalizePriceHistory([first,second],[],'ALL',now).length,0);
 assert.equal(normalizePriceHistory([second,first],[],'ALL',now).length,0);
 assert.equal(normalizePriceHistory([first,{...first}],[],'ALL',now).length,1);
});
