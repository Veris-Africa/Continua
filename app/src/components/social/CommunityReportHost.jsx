import {useEffect,useState,Suspense} from 'react';
import {lazyWithRetry} from '@/lib/lazyWithRetry';
const ReportDialog=lazyWithRetry(()=>import('./CommunityReportDialog'));
/** Keep the event receiver mounted; load the form only after a report intent. */
export function CommunityReportHost(){
 const [report,setReport]=useState(null);
 useEffect(()=>{const open=event=>{const value=event.detail;if(['post','user'].includes(value?.kind)&&typeof value.target==='string')setReport(value);};window.addEventListener('continua:report-request',open);return()=>window.removeEventListener('continua:report-request',open);},[]);
 return report?<Suspense fallback={<p role="status" className="fixed bottom-20 inset-x-4 z-50 rounded-xl border bg-background p-3">Opening report form…</p>}><ReportDialog key={report.kind+':'+report.target} report={report} onClose={()=>setReport(null)}/></Suspense>:null;
}
