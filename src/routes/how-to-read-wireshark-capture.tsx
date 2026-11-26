import { GuideSwitch } from '@/components/guide-switch';
import { ThirdPartyNotice } from '@/components/third-party-notice';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Activity, ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';

const title = 'How to read a Wireshark capture — Pktivo beginner guide';
const description = 'Learn to read Wireshark packet captures: understand the columns, spot DNS and TCP conversations, use filters and check warnings with Pktivo.';
export const Route = createFileRoute('/how-to-read-wireshark-capture')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'article' }, { property: 'og:url', content: 'https://pktivo.com/how-to-read-wireshark-capture' }, { name: 'twitter:card', content: 'summary' }],
    links: [{ rel: 'canonical', href: 'https://pktivo.com/how-to-read-wireshark-capture' }],
  }),
  component: CaptureReadingGuide,
});

const columns = [
  ['No.', 'The packet’s place in this capture, not a device ID.'],
  ['Time', 'Usually seconds since the capture started. A gap may be a pause, not a fault. Wireshark can display other time formats.'],
  ['Source / Destination', 'The sender and receiver. An IP address is an address, not proof of who a person is.'],
  ['Protocol', 'The kind of message: DNS, TCP, TLS and so on.'],
  ['Length', 'The frame size in bytes; it is not a speed measurement.'],
  ['Info', 'A short summary. Select the packet to see the actual fields.'],
];
const filters = [
  ['dns', 'Website name lookups and replies'],
  ['tcp', 'TCP connection traffic'],
  ['ip.addr == 192.168.1.10', 'IPv4 packets to or from this example device'],
  ['tcp.port == 443', 'TCP traffic using port 443; often HTTPS, but the port alone does not prove it'],
];

function CaptureReadingGuide() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-semibold"><PktivoLogo className="size-7 text-primary" />pktivo.</Link>
    </div></header>
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <GuideSwitch current="wireshark" />
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" />Beginner guide</div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl">How to read a Wireshark capture</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">A packet is a small piece of a conversation between devices. Start with who is talking, what they are saying, and whether a reply comes back—not every byte on the screen.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/packet-analyzer"><Activity />Open Packet Viewer<ArrowRight /></Link></Button><Button asChild variant="outline"><Link to="/learn"><BookOpen />Networking course</Link></Button></div>

      <section className="mt-12 border-t pt-8"><h2 className="text-2xl font-semibold">1. Start with a question</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Try “Did my device receive a DNS reply?” or “Did this connection start successfully?” A capture shows only traffic visible to the interface that recorded it, during that time window. It is not a complete view of the whole network.</p>
        <p className="mt-3 max-w-3xl leading-7">To record your own traffic, install <a className="text-primary underline underline-offset-4" href="https://www.wireshark.org/download.html" target="_blank" rel="noreferrer">Wireshark</a>, choose your active network interface, start a short capture, reproduce the issue, then stop. Save with File → Save As as PCAP or PCAPNG. In Pktivo, choose <strong>Open file</strong> or drag in that saved file. Existing captures need no new recording.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">2. Read the packet list</h2><p className="mt-3 leading-7 text-muted-foreground">Each row is one packet. These columns tell you where to begin.</p>
        <dl className="mt-5 divide-y">{columns.map(([name, meaning]) => <div key={name} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"><dt className="font-mono text-sm font-medium">{name}</dt><dd className="text-sm leading-6 text-muted-foreground">{meaning}</dd></div>)}</dl>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">3. Look for a conversation</h2><p className="mt-3 leading-7 text-muted-foreground">This made-up example shows a device asking for a website’s address. These are teaching examples, not anyone’s captured traffic.</p>
        <div className="mt-5 grid items-center gap-4 border-y bg-muted/30 px-4 py-6 sm:grid-cols-[1fr_2fr_1fr]">
          <div><p className="font-medium">Your device</p><p className="mt-1 font-mono text-xs text-muted-foreground">192.168.1.10</p></div>
          <div className="space-y-3 text-sm"><p className="flex items-center gap-2 text-primary"><ArrowRight className="size-5 shrink-0" />DNS query: Where is example.com?</p><p className="flex items-center gap-2"><ArrowLeft className="size-5 shrink-0" />DNS reply: Here is an address.</p></div>
          <div><p className="font-medium">DNS resolver</p><p className="mt-1 font-mono text-xs text-muted-foreground">192.168.1.1</p></div>
        </div>
        <p className="mt-4 leading-7 text-muted-foreground">Match the DNS name and transaction ID, then compare the query and reply times. A reply can also report an error. No reply in this file means it was not observed—it does not, by itself, prove the resolver failed.</p>
        <p className="mt-3 leading-7 text-muted-foreground">For TCP, a connection often starts with <strong className="text-foreground">SYN → SYN, ACK → ACK</strong>: “Can we connect?” → “Yes” → “Ready.” TLS then protects many web conversations. HTTPS may also use QUIC over UDP, so not all web traffic follows this TCP pattern.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">4. Filter out the noise</h2><p className="mt-3 leading-7 text-muted-foreground">In Wireshark, use the display-filter bar; in Pktivo, open Packets and apply a display filter. Filters hide unrelated rows without deleting packets from the open capture. Clear the filter to see everything again.</p>
        <dl className="mt-4 divide-y">{filters.map(([filter, meaning]) => <div key={filter} className="py-4"><dt><code className="break-all text-sm text-primary">{filter}</code></dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">{meaning}</dd></div>)}</dl>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Replace the example IP with the address you are investigating. Display filters inspect saved traffic; capture filters decide what gets recorded. They use different syntax.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">5. Open one packet, then follow its context</h2><p className="mt-3 leading-7 text-muted-foreground">In Wireshark, select a row and expand the packet-details tree. In Pktivo, select a row, then open Technical details & bytes. Read from outside in: Ethernet carries the local frame, IP carries the network addresses, TCP or UDP carries ports, and the application layer describes the message.</p>
        <p className="mt-3 leading-7 text-muted-foreground">Ports help distinguish services and conversations; they do not identify a person. Where available, use Follow stream to compare both directions. Pktivo’s stream view groups captured payloads, but is not full sequence-aware TCP reassembly. It does not decrypt encrypted payloads, so you cannot assume it will show a website’s contents or passwords.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">6. Treat warnings as clues, not verdicts</h2><p className="mt-3 leading-7 text-muted-foreground">Repeated requests, resets or unusual traffic deserve a closer look. They can also have ordinary causes: retries, a closed application, a short recording or packet loss at the capture interface. Pktivo’s flags are rule-based hints, not proof of an attack; an unflagged packet is not a guarantee of safety.</p>
        <p className="mt-3 leading-7">Before drawing a conclusion, check the surrounding packets, both directions, the capture location and whether you can reproduce the same behavior. Verify important findings with Wireshark and other evidence.</p>
      </section>

      <aside className="mt-10 border-y py-5"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-primary" />Keep captures private</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Capture only networks and devices you have permission to inspect. Files can contain addresses, names and unencrypted data. Pktivo reads your file in this browser tab without uploading it; capture contents and results are not stored and are cleared when the tab closes. That does not remove the original file from your device.</p></aside>
      <section className="mt-10 pb-4"><h2 className="text-2xl font-semibold">Build the basics, then test yourself</h2><p className="mt-3 leading-7 text-muted-foreground">Learn addresses, DNS, TCP and network troubleshooting in the reading course, then check what you remember with questions and explanations.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/learn"><BookOpen />Read the course</Link></Button><Button asChild variant="outline"><Link to="/learn/test"><ClipboardCheck />Take the practice test</Link></Button></div></section>
    </main>
    <footer className="border-t px-4 py-6 text-center"><PktivoPronunciation className="text-xs" /><ThirdPartyNotice tools={['wireshark']} className="mx-auto mt-2 max-w-2xl" /></footer>
  </div>;
}