import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PktivoWorkspace } from '@/components/netlens-workspace';

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  head:()=>({meta:[{title:'Pktivo — Network packet analyzer'},{name:'description',content:'Capture traffic with Wireshark, then privately analyze saved PCAP and PCAPNG files in your browser with Pktivo.'},{property:'og:title',content:'Pktivo — Network packet analyzer'},{property:'og:description',content:'Private browser-based packet inspection, Wireshark capture guidance and beginner-friendly networking lessons.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: WorkspacePage,
});
function WorkspacePage(){const navigate=useNavigate();return <PktivoWorkspace onLearn={()=>void navigate({to:'/learn'})}/>}
