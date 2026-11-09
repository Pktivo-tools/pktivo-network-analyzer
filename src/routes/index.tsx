import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { NetpackWorkspace } from '@/components/netlens-workspace';

export const Route = createFileRoute('/')({
  head:()=>({meta:[{title:'Netpack — Network packet analyzer'},{name:'description',content:'Inspect captures, filter packets, follow conversations and explore network traffic with Netpack.'},{property:'og:title',content:'Netpack — Network packet analyzer'},{property:'og:description',content:'A modern workspace for packet inspection and network traffic analysis.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: WorkspacePage,
});
function WorkspacePage(){const navigate=useNavigate();return <NetpackWorkspace onDownloads={()=>void navigate({to:'/downloads'})}/>}
