import {it,expect,vi} from 'vitest';
vi.mock('../src/storage/repositories/candlesRepository.js',()=>({candlesRepository:{getCandles:vi.fn()}}));
import {candlesRepository} from '../src/storage/repositories/candlesRepository.js';
import {indicatorsService} from '../src/services/technical/indicatorsService.js';

it('fetches one complete observation window for three indicators with identical results',async()=>{
 const candles=Array.from({length:100},(_,i)=>({timestamp:new Date(Date.UTC(2025,0,i+1)).toISOString(),close:10+i/10,volume:100+i}));
 candlesRepository.getCandles.mockResolvedValue(candles);
 const requests=['SMA','RSI','MACD'].map(type=>({type,exchange:'NSE',symbol:'KCB',from:'2025-01-01',to:'2025-12-31'}));
 const before=await Promise.all(requests.map(req=>indicatorsService.compute(req)));
 expect(candlesRepository.getCandles).toHaveBeenCalledTimes(3);
 candlesRepository.getCandles.mockClear();
 expect(await indicatorsService.computeMany(requests)).toEqual(before);
 expect(candlesRepository.getCandles).toHaveBeenCalledTimes(1);
 expect(before[0].timestamps).toHaveLength(100);
});
