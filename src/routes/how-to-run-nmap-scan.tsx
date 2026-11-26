import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, BookOpen, Radar, ShieldCheck, TerminalSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';
import { ThirdPartyNotice } from '@/components/third-party-notice';
import { GuideSwitch } from '@/components/guide-switch';

const title = 'How to run an Nmap scan and read the results — Pktivo beginner guide';
const description = 'Beginner Nmap guide: install Nmap, run a safe first scan, save XML with -oX, understand open, closed and filtered ports, and view results privately in Pktivo Scan Map.';
export const Route = createFileRoute('/how-to-run-nmap-scan')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'article' }, { property: 'og:url', content: 'https://pktivo.com/how-to-run-nmap-scan' }, { name: 'twitter:card', content: 'summary' }],
    links: [{ rel: 'canonical', href: 'https://pktivo.com/how-to-run-nmap-scan' }],
  }),
  component: NmapGuide,
});

const install = [
  ['Windows', 'Download the installer from nmap.org and keep the Npcap option ticked. Run scans from Command Prompt or PowerShell; some scan types need “Run as administrator”.'],
  ['macOS', 'Use the .dmg from nmap.org, or Homebrew: brew install nmap. Prefix scans with sudo for SYN, UDP and OS detection.'],
  ['Linux', 'Install from your package manager, e.g. sudo apt install nmap or sudo dnf install nmap. Use sudo for raw-packet scans.'],
];
const firstScans = [
  ['nmap -sn -oX hosts.xml 192.168.1.0/24', 'Which devices are up? Host discovery only, no port scan. Gentle first step.'],
  ['nmap -oX scan.xml 192.168.1.20', 'The 1,000 most common TCP ports on one device.'],
  ['nmap -sV -oX scan.xml 192.168.1.0/24', 'Common ports plus service and version detection for your whole home subnet.'],
  ['sudo nmap -sS -sV -O -oX scan.xml 192.168.1.20', 'SYN scan, versions and an OS guess. Needs administrator rights.'],
  ['nmap -p 22,80,443 -oX scan.xml 192.168.1.20', 'Only the ports you list. Faster and quieter.'],
];
const states = [
  ['open', 'A program answered on this port. That is a service you can identify—and should check is meant to be reachable.'],
  ['closed', 'The device answered, but nothing is listening on this port. The host is up.'],
  ['filtered', 'No clear answer, usually because a firewall dropped the probe. Nmap cannot tell whether a service is behind it.'],
  ['open|filtered', 'Common for UDP: no reply, which can mean open or blocked. Not proof either way.'],
  ['unfiltered', 'Seen with ACK scans (-sA): the port is reachable, but Nmap cannot say if it is open or closed.'],
];
const options = [
  ['-sV', 'Ask services for their name and version.'],
  ['-O', 'Guess the operating system (needs administrator rights).'],
  ['-p 1-1024 / -p-', 'Choose ports: a range, or all 65,535.'],
  ['-T3 / -T4', 'Timing. T3 is the default; T4 is faster on reliable networks. Avoid T5 on networks you share.'],
  ['-Pn', 'Skip the “is it up?” check—useful when a firewall blocks pings, but slower.'],
  ['--script default', 'Run the safe default scripts for extra details.'],
  ['-oX file.xml', 'Save XML. This is the file Pktivo Scan Map opens. -oA saves XML, normal and grepable together.'],
];

function NmapGuide() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-semibold" aria-label="Pktivo home"><PktivoLogo className="size-7 text-primary" />pktivo.</Link>
    </div></header>
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <GuideSwitch current="nmap" />
      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" />Beginner guide</div>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold sm:text-4xl">How to run an Nmap scan and read the results</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">Nmap asks devices on a network “which doors are open?” and writes down the answers. Start small, scan only what you are allowed to, and save the result so you can read it calmly afterwards.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/scan-map"><Radar />Open Scan Map<ArrowRight /></Link></Button><Button asChild variant="outline"><Link to="/learn"><BookOpen />Networking course</Link></Button></div>

      <aside className="mt-10 border-y py-5"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5 text-primary" />Permission first</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Scan only your own devices and networks, or ones you have written permission to test. Scanning other people’s systems can break rules, contracts or laws, and can set off alarms. Work and school networks usually need approval.</p></aside>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">1. Install Nmap</h2><p className="mt-3 leading-7 text-muted-foreground">Get it from the <a className="text-primary underline underline-offset-4" href="https://nmap.org/download.html" target="_blank" rel="noreferrer">official Nmap download page</a>. Check it works by typing <code className="text-sm">nmap --version</code> in a terminal.</p>
        <dl className="mt-5 divide-y">{install.map(([os, how]) => <div key={os} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"><dt className="font-medium">{os}</dt><dd className="text-sm leading-6 text-muted-foreground">{how}</dd></div>)}</dl>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">2. Find your network range</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Look up your own address: <code className="text-sm">ipconfig</code> on Windows, <code className="text-sm">ip addr</code> on Linux, or System Settings → Network on macOS. If you are 192.168.1.37 with mask 255.255.255.0, your home network is <code className="text-sm">192.168.1.0/24</code>—the 254 addresses from .1 to .254. The examples below use made-up addresses; replace them with yours.</p></section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">3. Run a first scan and save it</h2><p className="mt-3 leading-7 text-muted-foreground">Pick one line, from gentlest to most detailed. Every example ends with <code className="text-sm">-oX</code> so Nmap saves an XML file Pktivo can open.</p>
        <dl className="mt-4 divide-y">{firstScans.map(([cmd, meaning]) => <div key={cmd} className="py-4"><dt className="flex items-start gap-2"><TerminalSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><code className="break-all text-sm text-primary">{cmd}</code></dt><dd className="mt-1 pl-6 text-sm leading-6 text-muted-foreground">{meaning}</dd></div>)}</dl>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">A /24 scan with -sV can take a few minutes. Press Enter or Space while it runs to see progress. The file is saved in the folder your terminal is in.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">4. Open the file in Scan Map</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Go to <Link to="/scan-map" className="text-primary underline underline-offset-4">Scan Map</Link>, choose <strong>Open scan file</strong> or drag the file in. You get a host list, a map grouped by subnet, a ports and services table and host details. Nothing is uploaded; the file is cleared when you close the tab.</p></section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">5. Understand port states</h2><p className="mt-3 leading-7 text-muted-foreground">Each port gets one state. These describe what Nmap saw from where you stood, at that moment.</p>
        <dl className="mt-5 divide-y">{states.map(([name, meaning]) => <div key={name} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"><dt className="font-mono text-sm font-medium">{name}</dt><dd className="text-sm leading-6 text-muted-foreground">{meaning}</dd></div>)}</dl>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">6. Read services and versions carefully</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">With -sV, Nmap shows names like <code className="text-sm">ssh OpenSSH 9.6</code> or <code className="text-sm">http nginx</code>. A version is a strong hint, not a guarantee—services can hide or fake banners. An OS guess is a best match with a confidence level. Before worrying about an old version, check whether your vendor has already patched it.</p>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Ask three questions per open port: Do I know what this is? Should it be reachable from here? Is it up to date? Remote desktop, file sharing or databases open to a whole network deserve a closer look.</p></section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">7. Useful options as you grow</h2>
        <dl className="mt-4 divide-y">{options.map(([flag, meaning]) => <div key={flag} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"><dt><code className="text-sm text-primary">{flag}</code></dt><dd className="text-sm leading-6 text-muted-foreground">{meaning}</dd></div>)}</dl>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Try the Scan simulator tab in Scan Map to see which packets each scan type sends and to build a command with checkboxes.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">8. Compare scans over time</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Run the same command again next week and save it under a new name. In Scan Map’s Compare scans tab, load both to see new devices, devices that disappeared, newly open ports and changed versions. A change is a reason to check, not proof of a problem—devices sleep, phones leave and updates change versions.</p></section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">9. Watch the scan with Wireshark (optional)</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">To see what a scan really sends, start a Wireshark capture, run a small scan against one of your own devices, stop the capture and open it in the <Link to="/packet-analyzer" className="text-primary underline underline-offset-4">packet viewer</Link>. Filter with <code className="text-sm">tcp.flags.syn == 1</code> to see the probes.</p></section>

      <section className="mt-10 pb-4"><h2 className="text-2xl font-semibold">Build the basics</h2><p className="mt-3 leading-7 text-muted-foreground">Ports, TCP handshakes and subnets make Nmap results much easier to read. Learn them in the free course.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/learn"><BookOpen />Read the course</Link></Button><Button asChild variant="outline"><Link to="/learn/subnetting">Subnetting course</Link></Button></div></section>
    </main>
    <footer className="border-t px-4 py-6 text-center"><PktivoPronunciation className="text-xs" /><ThirdPartyNotice tools={['nmap', 'wireshark']} className="mx-auto mt-2 max-w-2xl" /></footer>
  </div>;
}
