import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { NetlensWorkspace } from '@/components/netlens-workspace';

export const Route = createFileRoute('/')({
  head:()=>({meta:[{title:'Netlens — Network packet analyzer'},{name:'description',content:'Inspect captures, filter packets, follow conversations and explore network traffic with Netlens.'},{property:'og:title',content:'Netlens — Network packet analyzer'},{property:'og:description',content:'A modern workspace for packet inspection and network traffic analysis.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: WorkspacePage,
});
function WorkspacePage(){const navigate=useNavigate();return <NetlensWorkspace onDownloads={()=>void navigate({to:'/downloads'})}/>}
