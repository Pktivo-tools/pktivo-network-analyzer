import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PktivoWorkspace } from '@/components/netlens-workspace';

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  head:()=>({meta:[{title:'Pktivo — Network packet analyzer'},{name:'description',content:'Capture traffic with Wireshark, then privately analyze saved PCAP and PCAPNG files in your browser with Pktivo.'},{property:'og:title',content:'Pktivo — Private browser-based packet analyzer'},{property:'og:description',content:'Open saved Wireshark PCAP and PCAPNG captures and inspect every packet privately in your browser — nothing is uploaded.'},{property:'og:type',content:'website'},{property:'og:url',content:'https://pktivo.com/'},{name:'twitter:card',content:'summary_large_image'}]}),
  component: WorkspacePage,
});
function WorkspacePage(){const navigate=useNavigate();return <PktivoWorkspace onLearn={()=>void navigate({to:'/learn'})} onAbout={()=>void navigate({to:'/pcap-file-analyzer-online'})} onGuide={()=>void navigate({to:'/how-to-read-wireshark-capture'})}/>}
