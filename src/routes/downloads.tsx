import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { NetlensDownloads } from '@/components/netlens-downloads';
export const Route=createFileRoute('/downloads')({
  head:()=>({meta:[{title:'Download Netlens — Windows, macOS & Linux'},{name:'description',content:'Download the Netlens desktop preview for Windows, macOS, Debian, Ubuntu and Arch Linux. Inspect network captures locally.'},{property:'og:title',content:'Download Netlens for your computer'},{property:'og:description',content:'Desktop packet analysis for Windows, macOS, Debian/Ubuntu and Arch Linux, with private capture analysis and beginner-friendly findings.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
  component:DownloadsPage,
});
function DownloadsPage(){const navigate=useNavigate();return <NetlensDownloads onBack={()=>void navigate({to:'/'})}/>}