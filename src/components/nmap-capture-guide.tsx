import { Link } from '@tanstack/react-router';
import { BookOpen, ExternalLink, FolderOpen, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThirdPartyNotice } from '@/components/third-party-notice';

/** Short "Capture with Nmap" steps shown in the Scan Map menu dialog. */
export function NmapCaptureGuide({ onOpen }: { onOpen: () => void }) {
  return <section aria-label="Capture with Nmap" className="space-y-3 text-sm leading-6">
    <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary"><Radar className="size-4" /></span><p className="text-xs leading-5 text-muted-foreground">Install Nmap to scan. Pktivo reads the saved XML result in your browser—no Pktivo app to install.</p></div>
    <Button asChild variant="outline" size="sm"><a href="https://nmap.org/download.html" target="_blank" rel="noopener noreferrer"><ExternalLink />Install Nmap</a></Button>
    <ol className="list-decimal space-y-2 pl-5">
      <li>Install Nmap for Windows, macOS or Linux from the official website. On Windows, also install Npcap when prompted.</li>
      <li>Open a terminal (Command Prompt or PowerShell on Windows). Scan only networks and devices you own or have permission to test.</li>
      <li>Run a scan and save it as XML, for example <code className="text-xs">nmap -sV -oX scan.xml 192.168.1.0/24</code>. The <code className="text-xs">-oX</code> part writes the file Pktivo can read.</li>
      <li>Return here, click <strong>Open scan file</strong> on the Results tab, and choose <code className="text-xs">scan.xml</code>. You can also drag it onto the page.</li>
    </ol>
    <p className="text-xs text-muted-foreground">Already have an Nmap XML file? Open it directly. The sample scan works without installing anything. Your file is read privately on this device, not uploaded.</p>
    <ThirdPartyNotice tools={['nmap']} />
    <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onOpen}><FolderOpen />Go to Results</Button><Button asChild variant="ghost" size="sm"><Link to="/how-to-run-nmap-scan"><BookOpen />Full Nmap guide</Link></Button></div>
  </section>;
}
