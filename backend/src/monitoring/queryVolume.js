import {createHash} from 'node:crypto';

// Result-value estimates, NOT provider network counters. Bounded sampling avoids
// serializing multi-MB responses again. SQL, bind values and row data never leave
// this function; metrics stay in process memory and reset on restart.
export function createQueryVolume() {
    const entries=new Map();
    const startedAt=new Date().toISOString();
    function record(text,result,milliseconds,failed=false) {
        try {
            const sql=typeof text==='string'?text:text?.text??'';
            const fingerprint=createHash('sha256').update(sql).digest('hex').slice(0,16);
            const key=entries.has(fingerprint)||entries.size<128?fingerprint:'overflow';
            const metric=entries.get(key)??{fingerprint:key,calls:0,failures:0,rows:0,estimatedResultValueBytes:0,milliseconds:0,sampleTruncations:0};
            metric.calls++;metric.failures+=Number(failed);metric.milliseconds+=Math.max(0,milliseconds);
            const rows=Array.isArray(result?.rows)?result.rows:[];
            metric.rows+=rows.length;
            let nodes=0,truncated=false;
            function size(value,depth=0) {
                if(++nodes>4096||depth>12){truncated=true;return 0;}
                if(value==null)return 0;
                if(typeof value==='string')return Buffer.byteLength(value);
                if(Buffer.isBuffer(value))return value.length;
                if(value instanceof Date)return 24;
                if(typeof value==='object'){
                    let bytes=0;
                    for(const item of Object.values(value)){
                        bytes+=size(item,depth+1);
                        if(nodes>4096)break;
                    }
                    return bytes;
                }
                return Buffer.byteLength(String(value));
            }
            const sample=rows.slice(0,8);
            let bytes=0;for(const row of sample)bytes+=size(row);
            metric.estimatedResultValueBytes+=sample.length?Math.round(bytes*rows.length/sample.length):0;
            metric.sampleTruncations+=Number(truncated);
            entries.set(key,metric);
        } catch { /* Observability cannot fail a query or replay a write. */ }
    }
    return {record,snapshot:()=>({startedAt,coverage:'shared query helper only; excludes transactions, separate identity pools and direct pool callers',
        unit:'sampled decoded result-value byte estimate; not Neon billed/network transfer',
        queries:[...entries.values()].map(metric=>({...metric})).sort((a,b)=>b.estimatedResultValueBytes-a.estimatedResultValueBytes)})};
}
export const queryVolume=createQueryVolume();
