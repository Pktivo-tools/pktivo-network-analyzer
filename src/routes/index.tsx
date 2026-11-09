import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PktivoWorkspace } from '@/components/netlens-workspace';

export const Route = createFileRoute('/')({
  head:()=>({meta:[{title:'Pktivo — Network packet analyzer'},{name:'description',content:'Inspect captures, filter packets, follow conversations and explore network traffic with Pktivo.'},{property:'og:title',content:'Pktivo — Network packet analyzer'},{property:'og:description',content:'A modern workspace for packet inspection and network traffic analysis.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: WorkspacePage,
});
function WorkspacePage(){const navigate=useNavigate();return <PktivoWorkspace onDownloads={()=>void navigate({to:'/downloads'})} onLearn={()=>void navigate({to:'/learn'})}/>}
