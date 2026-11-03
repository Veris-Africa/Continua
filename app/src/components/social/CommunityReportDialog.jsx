import {useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {useToast} from '@/hooks/use-toast';
import {supabase} from '@/integrations/continua/browserClient';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
const reasons=['Spam or scam','Harassment or hate','Misleading financial claims','Copyright infringement','Threats or unsafe content','Other'];
export default function CommunityReportDialog({report,onClose}){
 const {user}=useAuth(),{toast}=useToast();const [busy,setBusy]=useState(false),[reason,setReason]=useState(reasons[0]),[details,setDetails]=useState('');
 const submit=async()=>{if(!user||busy)return;setBusy(true);try{
  const {error}=await supabase.rpc('community_submit_report',{p_kind:report.kind,p_target:report.target,p_reason:reason,p_details:details.trim()});if(error)throw error;
  onClose();toast({title:'Report received',description:'Saved for review. Reporting does not automatically remove content.'});
 }catch{toast({title:"Couldn't submit your report",description:'Please retry. It has not been confirmed.',variant:'destructive'});}finally{setBusy(false);}};
 return <Dialog open onOpenChange={value=>{if(!value&&!busy)onClose();}}><DialogContent onClick={event=>event.stopPropagation()}>
  <DialogTitle className="pr-10">Report {report.kind==='post'?'post':'account'}</DialogTitle><DialogDescription>Help keep TradersHub safe. Choose the concern below. Your report is private and goes to the operator for review.</DialogDescription>
  <label className="text-sm">Reason<select className="block w-full rounded border bg-background p-2 mt-1" value={reason} onChange={event=>setReason(event.target.value)}>{reasons.map(value=><option key={value}>{value}</option>)}</select></label>
  <label className="text-sm">Additional context (optional)<textarea className="block w-full rounded border bg-background p-2 mt-1" maxLength={1000} value={details} onChange={event=>setDetails(event.target.value)} placeholder="Explain the concern. Do not include passwords or private payment details."/></label>
  <Button disabled={busy||!user} onClick={()=>void submit()}>{busy?'Submitting…':'Submit report'}</Button>
 </DialogContent></Dialog>;
}
