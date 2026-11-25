import { ExternalLink, FolderOpen, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SavedCaptureGuide({onOpen,disabled,expanded=false}:{onOpen:()=>void;disabled:boolean;expanded?:boolean}) {
  return <section aria-label="Capture with Wireshark" className={expanded?'space-y-4':'mx-4 mb-4 border-y bg-muted/30 px-3 py-4 sm:mx-6 sm:px-4'}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3"><Radio className="mt-0.5 size-5 shrink-0 text-primary"/><div><h2 className="text-sm font-semibold">Capture in Wireshark. Analyze in Pktivo.</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Install Wireshark to record your network traffic, then open the saved file here. Pktivo runs in your browser—no Pktivo app to install.</p></div></div>
      <Button asChild variant="outline" size="sm"><a href="https://www.wireshark.org/download.html" target="_blank" rel="noopener noreferrer"><ExternalLink/>Install Wireshark</a></Button>
    </div>
    <details open={expanded} className="mt-3 text-sm"><summary className="w-fit cursor-pointer text-xs font-medium text-primary">How to record and open a capture</summary><div className="mt-3 space-y-3 leading-6">
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
