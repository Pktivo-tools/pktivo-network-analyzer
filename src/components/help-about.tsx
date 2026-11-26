import type { ReactNode } from 'react';
import { GitHubLink } from '@/components/github-link';
import { ThirdPartyNotice } from '@/components/third-party-notice';

/** Shared "Help & about" content for the packet viewer and Scan Map. */
export function HelpAbout({ children }: { children?: ReactNode }) {
  return <div className="space-y-5 text-sm">
    <p>Pktivo has two private tools: a packet viewer for saved Wireshark captures and Scan Map for saved Nmap scan results. It is not a Wireshark or Nmap distribution. Your files stay on your device.</p>
    <div className="border-y py-4"><h3 className="mb-2 font-medium">Packet viewer</h3><p className="text-muted-foreground">PCAP and PCAPNG · Ethernet, IPv4/IPv6, TCP, UDP, DNS, HTTP, TLS, QUIC, ARP, ICMP and more. TCP stream view is a payload conversation, not full sequence-aware reassembly. Encrypted payloads are not decrypted.</p></div>
    <div className="border-b pb-4"><h3 className="mb-2 font-medium">Scan Map</h3><p className="text-muted-foreground">Nmap XML (<code className="text-xs">-oX</code>) · hosts by subnet, open ports, services and versions, OS guesses, script output, scan comparison, a scan-type simulator and a script playbook. Port hints are clues, not proof. Only scan networks you own or may test.</p></div>
    <div className="border-b pb-4"><h3 className="mb-2 font-medium">Source code</h3><div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2.5"><div><p className="text-sm font-medium">Pktivo on GitHub</p><p className="mt-0.5 text-xs text-muted-foreground">See how it works, report a problem, or read the full project page.</p></div><GitHubLink label="Open repository" className="shrink-0" /></div></div>
    <p className="text-xs text-muted-foreground">Browsers cannot record network traffic or send scans. Record traffic with Wireshark or scan with Nmap, then open the saved file here.</p>
    <ThirdPartyNotice tools={['wireshark', 'nmap']} />
    {children}
  </div>;
}
