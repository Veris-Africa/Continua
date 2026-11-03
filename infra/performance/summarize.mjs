import {readFile,writeFile} from 'node:fs/promises';
const keys=['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index','total-byte-weight'];
const summary={};
for(const stage of ['baseline','final'])for(const preset of ['mobile','desktop']){
 const r=JSON.parse(await readFile(`.qa-artifacts/phase5-${stage}-${preset}.json`,'utf8'));
 if(r.requestedUrl!=='http://127.0.0.1:5185/')throw Error('Only the offline baseline fixture is accepted');
 summary[stage+'-'+preset]={lighthouse:r.lighthouseVersion,measuredAt:r.fetchTime,warnings:r.runWarnings,metrics:Object.fromEntries(keys.map(key=>[key,r.audits[key]?.numericValue])),requests:r.audits['network-requests'].details.items.length,chartLoaded:r.audits['network-requests'].details.items.some(row=>row.url.includes('CartesianChart')),animationLoaded:r.audits['network-requests'].details.items.some(row=>row.url.includes('proxy-'))};
}
await writeFile('.qa-artifacts/phase5-comparison.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
