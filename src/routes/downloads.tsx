import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PktivoDownloads } from '@/components/netlens-downloads';
export const Route=createFileRoute('/downloads')({
  head:()=>({meta:[{title:'Download Pktivo — Windows, macOS & Linux'},{name:'description',content:'Download the Pktivo desktop preview for Windows, macOS, Debian, Ubuntu and Arch Linux. Inspect network captures locally.'},{property:'og:title',content:'Download Pktivo for your computer'},{property:'og:description',content:'Desktop packet analysis for Windows, macOS, Debian/Ubuntu and Arch Linux, with private capture analysis and beginner-friendly findings.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component:DownloadsPage,
});
function DownloadsPage(){const navigate=useNavigate();return <PktivoDownloads onBack={()=>void navigate({to:'/'})}/>}