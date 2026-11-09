import { CircleHelp, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SavedCaptureGuide({onOpen,disabled}:{onOpen:()=>void;disabled:boolean}) {
  return <details className="mx-4 mb-4 border-b pb-3 text-xs sm:mx-6">
    <summary className="flex w-fit cursor-pointer list-none items-center gap-2 py-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"><CircleHelp className="size-3.5"/><span>Open a saved capture</span><span className="text-primary">How?</span></summary>
    <div className="mt-3 max-w-xl space-y-3 text-sm leading-6">
      <ol className="list-decimal space-y-2 pl-5">
        <li>In the desktop app, stop capturing and click <strong>Export</strong> to save a <code className="text-xs">.pcapng</code> file.</li>
        <li>Here, click <strong>Open file</strong> (the folder icon on mobile) and choose your saved file. You can also drag it onto the analyzer.</li>
        <li>Your packets and automatic findings appear in <strong>Overview</strong>.</li>
      </ol>
      <p className="text-xs text-muted-foreground">Supports .pcap and .pcapng. Files stay on your device. Export saves only the displayed packets—clear filters and choose All messages first to save everything.</p>
      <Button variant="outline" size="sm" disabled={disabled} onClick={onOpen}><FolderOpen/>Choose a capture file</Button>
    </div>
  </details>;
}