import { ChevronDown, ExternalLink, FolderOpen, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SavedCaptureGuide({onOpen,disabled,expanded=false}:{onOpen:()=>void;disabled:boolean;expanded?:boolean}) {
  return <section aria-label="Capture with Wireshark" className={expanded?'space-y-4':'mx-4 mb-3 border-y sm:mx-6'}>
    <details open={expanded} className="group text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary"><Radio className="size-4"/></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Capture with Wireshark</span><span className="mt-0.5 block text-xs text-muted-foreground">Record there. Open your saved file here.</span></span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"/>
      </summary>
      <div className="space-y-3 border-t py-4 leading-6">
      <p className="text-xs leading-5 text-muted-foreground">Install Wireshark to record new traffic. Pktivo reads saved captures in your browser—no Pktivo app to install.</p>
      <Button asChild variant="outline" size="sm"><a href="https://www.wireshark.org/download.html" target="_blank" rel="noopener noreferrer"><ExternalLink/>Install Wireshark</a></Button>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Install Wireshark for Windows, macOS or Linux from the official website. On Windows, also install Npcap when prompted. On macOS, install the included ChmodBPF package; on Linux, enable capture permissions for your user when prompted, then sign out and back in.</li>
        <li>Open Wireshark and double-click your active Wi-Fi or Ethernet connection. Record only traffic you have permission to capture.</li>
        <li>Click Wireshark’s red stop button, then choose <strong>File → Save As</strong> and save a <code className="text-xs">.pcapng</code> file.</li>
        <li>Return here, click <strong>Open file</strong> (the folder icon on mobile), and choose your saved file. You can also drag it onto Pktivo.</li>
      </ol>
      <p className="text-xs text-muted-foreground">Already have a .pcap or .pcapng file? Open it directly—Wireshark is only needed to record new traffic. The sample capture works without installing anything. Your file is read privately on this device, not uploaded.</p>
      <Button variant="outline" size="sm" disabled={disabled} onClick={onOpen}><FolderOpen/>Choose a capture file</Button>
    </div></details>
  </section>;
}
