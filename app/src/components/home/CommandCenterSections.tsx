import {useNavigate} from 'react-router-dom';
import {TrendingUp,Calendar,Coins,ChevronRight} from 'lucide-react';
// No seeded target prices, growth rates, yields or relative earnings dates.
const tools=[
 {title:'Company research',description:'Compare published company evidence and disclosed coverage.',path:'/screener',icon:TrendingUp},
 {title:'Financial statements',description:'Open an issuer to inspect dated reported financials.',path:'/markets',icon:Coins},
 {title:'Dividends and events',description:'Check source-backed corporate actions and announcement dates.',path:'/engine?tool=Events',icon:Calendar},
];
export function CommandCenterSections(){
 const navigate=useNavigate();
 return <section aria-label="Verified research tools" className="space-y-3"><p className="section-eyebrow">Continue your research</p>
 {tools.map(({title,description,path,icon:Icon})=><button type="button" key={title} className="w-full flex items-center gap-3 border-t border-border/60 py-3 text-left" onClick={()=>navigate(path)}><Icon className="h-4 w-4 text-primary shrink-0"/><span className="flex-1"><strong className="block text-xs">{title}</strong><span className="text-xs text-muted-foreground">{description}</span></span><ChevronRight className="h-4 w-4"/></button>)}
 </section>;
}
