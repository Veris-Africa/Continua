import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {evaluateSignals} from '../../backend/src/monitoring/alertPolicy.js';
export function capacityReport(receipt,now=Date.now()){
 const signals=evaluateSignals({providerUsage:receipt},now).filter(s=>s.category.startsWith('neon_'));
 const current=Date.parse(receipt?.observedAt),previous=receipt?.previous,elapsed=previous?(current-Date.parse(previous.observedAt))/3600000:0;
 const valid=signals.find(s=>s.category==='neon_quota')?.state!=='unavailable';
 const slope=valid&&elapsed>=1&&previous.period===receipt.period&&Number.isFinite(previous.transferBytes)&&receipt.transferBytes>=previous.transferBytes?(receipt.transferBytes-previous.transferBytes)/elapsed:null;
 return {source:'dated provider-reported receipt, not application SQL estimates',observedAt:Number.isFinite(current)?new Date(current).toISOString():null,signals,
  usedPercent:valid?100*receipt.transferBytes/receipt.allowanceBytes:null,bytesPerHour:slope,
  hoursUntilAllowance:slope>0?Math.max(0,(receipt.allowanceBytes-receipt.transferBytes)/slope):null,
  warning:'Two points give an observed interval slope, not a reliable monthly forecast. Missing/old/reset-period data is unavailable; no provider calls or SQL are issued.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const bytes=readFileSync(process.argv[2]);if(bytes.length>16384)throw Error('Receipt exceeds operator input bound');console.log(JSON.stringify(capacityReport(JSON.parse(bytes)),null,2));}
