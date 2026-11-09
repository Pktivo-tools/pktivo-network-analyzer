import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { NetpackDownloads } from '@/components/netlens-downloads';
export const Route=createFileRoute('/downloads')({
  head:()=>({meta:[{title:'Download Netpack — Windows, macOS & Linux'},{name:'description',content:'Download the Netpack desktop preview for Windows, macOS, Debian, Ubuntu and Arch Linux. Inspect network captures locally.'},{property:'og:title',content:'Download Netpack for your computer'},{property:'og:description',content:'Desktop packet analysis for Windows, macOS, Debian/Ubuntu and Arch Linux, with private capture analysis and beginner-friendly findings.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component:DownloadsPage,
});
function DownloadsPage(){const navigate=useNavigate();return <NetpackDownloads onBack={()=>void navigate({to:'/'})}/>}