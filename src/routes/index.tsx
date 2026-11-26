import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, BookOpen, ClipboardCheck, FileSearch, GitCompare, GraduationCap, Layers, Lock, Network, Radar, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';
import { GitHubLink } from '@/components/github-link';

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: 'Pktivo — Private network analysis tools and free CCNA learning' },
    { name: 'description', content: 'Open Wireshark captures and Nmap scans privately in your browser, and learn networking from zero to CCNA with free courses, a subnetting trainer and practice tests.' },
    { property: 'og:title', content: 'Pktivo — Network tools and learning, private in your browser' },
    { property: 'og:description', content: 'Packet analyzer, Nmap Scan Map and a free CCNA learning path. Nothing you open is uploaded.' },
    { property: 'og:type', content: 'website' }, { property: 'og:url', content: 'https://pktivo.com/' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: HomePage,
});

type Item = { to: '/packet-analyzer' | '/scan-map' | '/learn' | '/learn/subnetting' | '/learn/test' | '/glossary' | '/how-to-read-wireshark-capture'; icon: ComponentType<{ className?: string }>; title: string; text: string; tag: string };
const tools: Item[] = [
  { to: '/packet-analyzer', icon: Layers, title: 'Packet analyzer', text: 'Open a Wireshark .pcap or .pcapng file. See every packet explained, flagged warnings, conversations, streams and statistics.', tag: 'Wireshark files' },
  { to: '/scan-map', icon: Radar, title: 'Scan Map', text: 'Open Nmap XML results as a network map with open ports and services. Compare scans and learn what each scan type does.', tag: 'Nmap files' },
  { to: '/packet-analyzer', icon: GitCompare, title: 'Compare captures', text: 'Put two captures side by side to see what changed — inside the packet analyzer under "Compare captures".', tag: 'Two files' },
];
const learning: Item[] = [
  { to: '/learn', icon: GraduationCap, title: 'Networking course', text: 'From "what is a packet?" to CCNA-level topics, in four levels.', tag: 'Beginner → Pro' },
  { to: '/learn/subnetting', icon: Network, title: 'Subnetting course', text: 'Twelve lessons, a practice trainer and a scenario exam.', tag: 'Hands-on' },
  { to: '/learn/test', icon: ClipboardCheck, title: 'Practice test', text: 'Random questions from the course with explanations.', tag: 'Quiz' },
  { to: '/how-to-read-wireshark-capture', icon: FileSearch, title: 'Capture guide', text: 'How to read a Wireshark capture, step by step.', tag: 'Guide' },
  { to: '/glossary', icon: BookOpen, title: 'Glossary', text: 'Networking and Wireshark words in plain language.', tag: 'Reference' },
];

function Card({ item, big }: { item: Item; big?: boolean }) {
  const Icon = item.icon;
  return <Link to={item.to} className="group flex flex-col rounded-xl border bg-card p-5 text-card-foreground transition-colors hover:border-primary">
    <div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span><span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{item.tag}</span></div>
    <h3 className={`mt-4 font-semibold ${big ? 'text-lg' : ''}`}>{item.title}</h3>
    <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Open<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
  </Link>;
}

function HomePage() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b px-4 py-3 sm:px-8"><div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
      <Link to="/" className="flex items-center gap-2 font-semibold"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link>
      <nav className="flex items-center gap-1"><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/learn">Learn</Link></Button><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/scan-map">Scan Map</Link></Button><Button asChild size="sm"><Link to="/packet-analyzer">Packet analyzer</Link></Button></nav>
    </div></header>
    <main>
      <section className="px-4 pb-14 pt-16 sm:px-8 sm:pt-24"><div className="mx-auto max-w-6xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-primary" />Everything runs in your browser</span>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">See what your network is really doing<span className="text-primary">.</span></h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Pktivo turns Wireshark captures and Nmap scans into plain-language pictures — and teaches you networking from the very first packet to CCNA. Free, private, no account.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/packet-analyzer"><Layers />Open a capture</Link></Button><Button asChild size="lg" variant="outline"><Link to="/learn"><GraduationCap />Start learning</Link></Button></div>
      </div></section>

      <section className="border-t px-4 py-14 sm:px-8"><div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold">Tools</h2><p className="mt-1 text-muted-foreground">Open a file you saved. Nothing gets uploaded.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{tools.map(t => <Card key={t.title} item={t} big />)}</div>
      </div></section>

      <section className="border-t bg-muted/30 px-4 py-14 sm:px-8"><div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold">Learning</h2><p className="mt-1 text-muted-foreground">A free path toward the Cisco CCNA, with your reading progress saved on this device.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{learning.map(t => <Card key={t.title} item={t} />)}</div>
      </div></section>

      <section className="border-t px-4 py-14 sm:px-8"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        {[[Waypoints, '1. Record', 'Capture traffic with Wireshark or scan with Nmap on your own computer, and save the file.'], [Sparkles, '2. Open in Pktivo', 'Drop the file in. Pktivo explains what happened and flags what deserves a second look.'], [Lock, '3. Close the tab', 'Your file disappears completely. No uploads, no storage, nobody else sees it.']].map(([I, t, d]) => { const Icon = I as ComponentType<{ className?: string }>; return <div key={t as string}><Icon className="size-6 text-primary" /><h3 className="mt-3 font-semibold">{t as string}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{d as string}</p></div>; })}
      </div></section>
    </main>
    <footer className="border-t px-4 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
      <div><PktivoPronunciation className="text-xs" /><p className="mt-1">Built by AI — double-check important results. <Link to="/privacy" className="underline">Privacy</Link></p></div>
      <GitHubLink label="Pktivo on GitHub" />
    </div></footer>
  </div>;
}
