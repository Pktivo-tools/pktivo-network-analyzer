import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, FileUp, Filter, Layers, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';

const title = 'PCAP file analyzer online — Pktivo';
const desc = 'Open PCAP and PCAPNG captures from Wireshark in your browser. Pktivo reads the file on your device, flags unusual traffic and lets you filter and inspect every packet.';
const url = 'https://pktivo.com/pcap-file-analyzer-online';

export const Route = createFileRoute('/pcap-file-analyzer-online')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [{ title }, { name: 'description', content: desc }, { property: 'og:title', content: title }, { property: 'og:description', content: desc }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: url }, { name: 'twitter:card', content: 'summary' }],
    links: [{ rel: 'canonical', href: url }],
  }),
  component: PcapAnalyzerPage,
});

const steps = [
  { icon: FileUp, t: 'Open your capture', b: 'Record traffic in Wireshark, save it with File → Save As as .pcap or .pcapng, then click "Open file" in Pktivo or drag the file onto the page.' },
  { icon: Layers, t: 'Read the overview', b: 'Pktivo lists every packet and points out traffic that matches its warning rules, each with a plain-language explanation and a suggested next step.' },
  { icon: Filter, t: 'Filter and inspect', b: 'Type Wireshark-style display filters such as dns or tcp.port == 443, open any packet to see each protocol layer and its bytes, and follow TCP or UDP streams.' },
];

function PcapAnalyzerPage() {
  return <div className="min-h-dvh bg-background text-foreground">
    <header className="border-b"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3"><Link to="/" className="flex items-center gap-2 font-semibold"><PktivoLogo />pktivo.</Link><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft />Packet viewer</Link></Button></div></header>
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">PCAP file analyzer online</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">Pktivo opens network captures saved by Wireshark straight in your browser. No install and no account, and the file never leaves your device.</p>
      <Button asChild className="mt-6"><Link to="/"><FileUp />Open a capture file</Link></Button>
      <section className="mt-14"><h2 className="text-xl font-semibold">How it works</h2><ol className="mt-6 grid gap-4 sm:grid-cols-3">{steps.map((s, i) => <li key={s.t} className="rounded-lg border bg-card p-5"><s.icon className="size-5 text-primary" /><h3 className="mt-3 font-medium">{i + 1}. {s.t}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{s.b}</p></li>)}</ol></section>
      <section className="mt-14"><h2 className="text-xl font-semibold">Supported files and protocols</h2><p className="mt-3 leading-7 text-muted-foreground">Pktivo reads classic .pcap and .pcapng files. It decodes Ethernet, VLAN, ARP, IPv4/IPv6, TCP, UDP and ICMP, plus DNS, HTTP, TLS, QUIC, DHCP and NTP. You can export the open capture as .pcapng.</p></section>
      <section className="mt-14 rounded-lg border bg-card p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-5 text-primary" />Private by design</h2><p className="mt-3 leading-7 text-muted-foreground">Your capture is read only inside this browser tab. It is never uploaded or saved, and it is cleared from memory when you close the tab.</p></section>
      <section className="mt-14"><h2 className="text-xl font-semibold">Recording a capture</h2><p className="mt-3 leading-7 text-muted-foreground">Pktivo doesn't record traffic itself. Install Wireshark, start a capture on your network interface, stop it, and save the file. Then open that file here. If you're new to networking, the <Link to="/learn" className="text-primary underline">Learn course</Link> explains the basics.</p></section>
    </main>
    <footer className="border-t py-6 text-center text-xs text-muted-foreground"><PktivoPronunciation /></footer>
  </div>;
}
