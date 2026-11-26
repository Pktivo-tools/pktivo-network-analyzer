import { Simulator } from '@/components/scan-simulator';
import { Playbook } from '@/components/scan-playbook';
import { CommandBox } from '@/components/scan-command-box';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { HelpAbout } from '@/components/help-about';
import { NmapCaptureGuide } from '@/components/nmap-capture-guide';
import { resolveTheme } from '@/lib/netlens/themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeGrid, useTheme } from '@/components/theme-picker';
import { ThirdPartyNotice } from '@/components/third-party-notice';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, BookOpen, Download, Lightbulb, ListChecks, Search, Wand2, ChevronRight, CircleHelp, Menu, Copy, FileUp, GitCompare, Network, Radar, ScrollText, ShieldCheck, TerminalSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';
import { GitHubLink } from '@/components/github-link';
import { bindTabLifetime } from '@/lib/netlens/tab-lifetime';
import { diffScans, filterHosts, groupBySubnet, openPorts, parseNmapXml, type DiffItem, type NmapScan, type ScanHost } from '@/lib/scan/nmap-xml';
import { demoScanAfter, demoScanBefore } from '@/lib/scan/demo';
import { portNote } from '@/lib/scan/risk';
import { liveHostList, lookupPorts, nextSteps, recipeCommand, recipes, scanToCsv, serviceInventory, type Recipe } from '@/lib/scan/tools';
import { buildCommand, nseScripts, scanOptions, scanTypes, scriptCommand, scriptsFor } from '@/lib/scan/knowledge';

export const Route = createFileRoute('/scan-map')({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: 'Scan Map — private Nmap XML viewer & visualizer | Pktivo' },
    { name: 'description', content: 'Open Nmap -oX results in your browser: host map by subnet, open ports and services, scan comparison, an interactive scan-type simulator and an NSE script playbook. Nothing is uploaded.' },
    { property: 'og:title', content: 'Scan Map — private Nmap XML viewer by Pktivo' },
    { property: 'og:description', content: 'A modern, beginner-friendly Zenmap alternative that runs entirely in your browser.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ScanMapPage,
});

const TAB_LABELS: Record<string, string> = { results: 'Results', compare: 'Compare scans', simulator: 'Scan simulator', scripts: 'Script playbook', recipes: 'Scan recipes', ports: 'Port lookup' };

function ScanMenu({ onModal }: { onModal: (m: 'nmap' | 'help') => void }) {
  const [open, setOpen] = useState(false);
  const { theme, select } = useTheme();
  const close = () => setOpen(false);
  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Menu" title="Menu: tools, learning, themes"><Menu className="size-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-[calc(100dvh-6rem)] w-72 overflow-y-auto p-2" aria-label="Pktivo menu">
      <DropdownMenuLabel className="px-2 text-[11px] font-medium text-muted-foreground">Pktivo</DropdownMenuLabel>
      <DropdownMenuItem asChild className="gap-2"><Link to="/packet-analyzer" onClick={close}><Activity className="size-4" />Packet viewer (Wireshark files)</Link></DropdownMenuItem>
      <DropdownMenuItem className="gap-2" onSelect={() => { close(); onModal('nmap'); }}><Radar className="size-4" />Capture with Nmap</DropdownMenuItem>
      <DropdownMenuItem asChild className="gap-2"><Link to="/learn" onClick={close}><BookOpen className="size-4" />Learn networking and subnetting</Link></DropdownMenuItem>
      <DropdownMenuItem asChild className="gap-2"><Link to="/how-to-run-nmap-scan" onClick={close}><BookOpen className="size-4" />Beginner capture guide</Link></DropdownMenuItem>
      <DropdownMenuItem asChild className="gap-2"><Link to="/glossary" onClick={close}><BookOpen className="size-4" />Networking glossary</Link></DropdownMenuItem>
      <DropdownMenuItem className="gap-2" onSelect={() => { close(); onModal('help'); }}><CircleHelp className="size-4" />Help & about</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="px-2 text-[11px] font-medium text-muted-foreground">Appearance · {resolveTheme(theme).name}</DropdownMenuLabel>
      <div className="px-1 pb-1"><ThemeGrid theme={theme} className="grid-cols-3 sm:grid-cols-2" onSelect={(id) => { select(id); close(); }} /></div>
    </DropdownMenuContent>
  </DropdownMenu>;
}

async function readScan(file: File): Promise<NmapScan> { return parseNmapXml(await file.text()); }

function ScanMapPage() {
  const [scan, setScan] = useState<NmapScan | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('results');
  const [modal, setModal] = useState<'nmap' | 'help' | null>(null);
  useEffect(() => bindTabLifetime(window, () => { setScan(null); setError(''); }), []);
  const open = async (f?: File) => { if (!f) return; try { setScan(await readScan(f)); setError(''); setTab('results'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not read this file.'); } };

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-7xl min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <Link to="/" className="mr-2 flex items-center gap-2 text-base font-semibold text-foreground" aria-label="Pktivo home"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link>
      <ScanMenu onModal={setModal} />
      <span className="hidden sm:inline">Scan Map</span><ChevronRight className="hidden size-3 sm:inline" /><span className="truncate font-medium text-foreground">{TAB_LABELS[tab]}</span>
      <span className="ml-2 hidden items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] md:inline-flex"><ShieldCheck className="size-3" />On this device</span>
    </div></header>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="flex items-center gap-2 text-sm text-primary"><Radar className="size-4" />Nmap results, visualized</div>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Scan Map for Nmap XML scan results</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Open an Nmap XML file to see every device, open port and service on a map. Learn what each scan type does, compare scans over time, and pick the right scripts.</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" /><p className="min-w-0 flex-1">Local, not uploaded. Scan files are read in this tab only and disappear when you close it. Only scan networks you own or have permission to test.</p><GitHubLink label="View code" iconSize={14} /></div>
      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="results"><Network className="size-4" />Results</TabsTrigger>
          <TabsTrigger value="compare"><GitCompare className="size-4" />Compare scans</TabsTrigger>
          <TabsTrigger value="simulator"><TerminalSquare className="size-4" />Scan simulator</TabsTrigger>
          <TabsTrigger value="recipes"><Wand2 className="size-4" />Scan recipes</TabsTrigger>
          <TabsTrigger value="scripts"><ScrollText className="size-4" />Script playbook</TabsTrigger>
          <TabsTrigger value="ports"><Search className="size-4" />Port lookup</TabsTrigger>
        </TabsList>
        <TabsContent value="results" className="mt-4">
          {scan ? <Results scan={scan} onClose={() => setScan(null)} onOpen={open} /> : <EmptyState error={error} onOpen={open} onDemo={() => { setScan(parseNmapXml(demoScanAfter)); setError(''); }} />}
        </TabsContent>
        <TabsContent value="compare" className="mt-4"><Compare /></TabsContent>
        <TabsContent value="simulator" className="mt-4"><Simulator /></TabsContent>
        <TabsContent value="scripts" className="mt-4"><Playbook scan={scan} /></TabsContent>
        <TabsContent value="recipes" className="mt-4"><Recipes /></TabsContent>
        <TabsContent value="ports" className="mt-4"><PortLookup /></TabsContent>
      </Tabs>
      <footer className="mt-10 border-t pt-6"><PktivoPronunciation className="text-xs" /><ThirdPartyNotice tools={['nmap','wireshark']} className="mt-2" /><p className="mt-1 text-xs text-muted-foreground">Port hints are clues, not proof.</p></footer>
    </main>
    <Dialog open={modal !== null} onOpenChange={o => { if (!o) setModal(null); }}><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-auto"><DialogTitle>{modal === 'nmap' ? 'Capture with Nmap' : 'About Pktivo'}</DialogTitle><DialogDescription>{modal === 'nmap' ? 'Scan with Nmap, then view the results privately in your browser.' : 'Private browser-based packet viewer and Nmap scan visualizer'}</DialogDescription>
      {modal === 'nmap' && <NmapCaptureGuide onOpen={() => { setModal(null); setTab('results'); }} />}
      {modal === 'help' && <HelpAbout><Button variant="outline" onClick={() => { setScan(parseNmapXml(demoScanAfter)); setError(''); setTab('results'); setModal(null); }}><Radar />Load sample scan</Button></HelpAbout>}
    </DialogContent></Dialog>
  </div>;
}

function FilePick({ label, onFile }: { label: string; onFile: (f?: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return <><input ref={ref} type="file" accept=".xml,text/xml,application/xml" className="hidden" aria-label={label} onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} /><Button variant="outline" onClick={() => ref.current?.click()}><FileUp />{label}</Button></>;
}

function EmptyState({ error, onOpen, onDemo }: { error: string; onOpen: (f?: File) => void; onDemo: () => void }) {
  return <div className="rounded-lg border border-dashed p-8 text-center" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onOpen(e.dataTransfer.files[0]); }}>
    <Radar className="mx-auto size-10 text-primary" />
    <h2 className="mt-3 text-lg font-medium">Drop an Nmap XML file here</h2>
    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Save your scan with <code className="rounded bg-muted px-1">-oX</code>, for example:</p>
    <code className="mt-3 inline-block rounded bg-muted px-3 py-1.5 font-mono text-sm">nmap -sV -oX scan.xml 192.168.1.0/24</code>
    <div className="mt-5 flex flex-wrap justify-center gap-2"><FilePick label="Open scan file" onFile={onOpen} /><Button onClick={onDemo}>Try a sample scan</Button></div>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  </div>;
}

function Results({ scan, onClose, onOpen }: { scan: NmapScan; onClose: () => void; onOpen: (f?: File) => void }) {
  const [text, setText] = useState(''); const [port, setPort] = useState('');
  const hosts = useMemo(() => filterHosts(scan.hosts, { text, port, onlyUp: true }), [scan, text, port]);
  const [sel, setSel] = useState<string>(scan.hosts[0]?.address ?? '');
  const host = scan.hosts.find(h => h.address === sel) ?? hosts[0];
  const totalOpen = scan.hosts.reduce((n, h) => n + openPorts(h).length, 0);
  const topPorts = useMemo(() => { const m = new Map<number, number>(); scan.hosts.forEach(h => openPorts(h).forEach(p => m.set(p.port, (m.get(p.port) ?? 0) + 1))); return [...m].sort((a, b) => b[1] - a[1]).slice(0, 8); }, [scan]);
  return <div data-private-capture className="space-y-4">
    <div className="flex flex-wrap items-center gap-2 text-sm"><code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs" title={scan.args}>{scan.args || 'nmap'}</code><Button variant="outline" size="sm" onClick={() => saveText(scanToCsv(scan), 'nmap-results.csv', 'text/csv')} title="Every host and port as a spreadsheet"><Download />CSV</Button><Button variant="outline" size="sm" onClick={() => saveText(liveHostList(scan), 'live-hosts.txt', 'text/plain')} title="Live hosts, one per line, for nmap -iL"><Download />Host list</Button><FilePick label="Open another" onFile={onOpen} /><Button variant="ghost" size="sm" onClick={onClose}><X />Close</Button></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Hosts up', scan.hosts.filter(h => h.status === 'up').length], ['Open ports', totalOpen], ['Subnets', groupBySubnet(scan.hosts).size], ['Scan time', scan.elapsed ? `${scan.elapsed}s` : '—']].map(([k, v]) => <div key={k} className="rounded-md border p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="text-xl font-semibold">{v}</div></div>)}</div>
    <div className="flex flex-wrap gap-2"><Input className="max-w-xs" placeholder="Filter: IP, name, service, OS…" value={text} onChange={e => setText(e.target.value)} aria-label="Filter hosts" />
      <div className="flex flex-wrap items-center gap-1 text-xs"><span className="text-muted-foreground">Open port:</span>{topPorts.map(([p, n]) => <Button key={p} size="sm" variant={port === String(p) ? 'secondary' : 'ghost'} className="h-7" aria-pressed={port === String(p)} onClick={() => setPort(port === String(p) ? '' : String(p))}>{p} <span className="text-muted-foreground">×{n}</span></Button>)}</div></div>
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <ul className="max-h-[32rem] overflow-y-auto rounded-md border" aria-label="Hosts">{hosts.map(h => <li key={h.address}><button className={`w-full border-b px-3 py-2 text-left text-sm hover:bg-muted ${host?.address === h.address ? 'bg-accent text-accent-foreground' : ''}`} onClick={() => setSel(h.address)}><div className="font-mono">{h.address}</div><div className="truncate text-xs text-muted-foreground">{h.hostname || h.vendor || 'unnamed'} · {openPorts(h).length} open</div></button></li>)}{!hosts.length && <li className="p-4 text-sm text-muted-foreground">No hosts match.</li>}</ul>
      <Tabs defaultValue="map"><TabsList><TabsTrigger value="map">Topology</TabsTrigger><TabsTrigger value="ports">Ports / services</TabsTrigger><TabsTrigger value="details">Host details</TabsTrigger><TabsTrigger value="services">All services</TabsTrigger><TabsTrigger value="next">Next steps</TabsTrigger></TabsList>
        <TabsContent value="map"><Topology hosts={hosts} selected={host?.address} onSelect={setSel} /></TabsContent>
        <TabsContent value="ports">{host ? <PortTable host={host} /> : null}</TabsContent>
        <TabsContent value="details">{host ? <HostDetails host={host} /> : null}</TabsContent>
        <TabsContent value="services"><Services scan={scan} port={port} onPort={setPort} /></TabsContent>
        <TabsContent value="next"><NextSteps scan={scan} /></TabsContent>
      </Tabs>
    </div>
  </div>;
}

function Topology({ hosts, selected, onSelect }: { hosts: ScanHost[]; selected: string | undefined; onSelect: (a: string) => void }) {
  const groups = [...groupBySubnet(hosts)];
  const W = 720, band = W / Math.max(groups.length, 1), perRow = Math.max(2, Math.floor(band / 70));
  const rows = Math.max(1, ...groups.map(([, hs]) => Math.ceil(hs.length / perRow)));
  const H = 230 + rows * 90, cx = W / 2, cy = 70;
  const gx = (i: number) => band * i + band / 2;
  return <div className="overflow-x-auto rounded-md border bg-card p-2"><svg viewBox={`0 0 ${W} ${H}`} className="min-w-[36rem]" role="img" aria-label="Network map grouped by subnet">
    <circle cx={cx} cy={cy - 30} r="16" className="fill-primary" /><text x={cx} y={cy - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">Scanner (you)</text>
    {groups.map(([net, hs], i) => { const x = gx(i), y = 150; return <g key={net}>
      <line x1={cx} y1={cy - 14} x2={x} y2={y - 14} className="stroke-border" strokeWidth="2" />
      <rect x={x - 62} y={y - 14} width="124" height="26" rx="6" className="fill-secondary stroke-border" /><text x={x} y={y + 3} textAnchor="middle" className="fill-secondary-foreground font-mono text-[11px]">{net}</text>
      {hs.map((h, j) => { const row = Math.floor(j / perRow), inRow = Math.min(perRow, hs.length - row * perRow), col = j % perRow; const step = Math.min(70, (band - 20) / inRow); const hx = x - ((inRow - 1) * step) / 2 + col * step, hy = y + 80 + row * 90; const n = openPorts(h).length; const risky = openPorts(h).some(p => portNote(p)?.level === 'watch');
        return <g key={h.address} className="cursor-pointer" onClick={() => onSelect(h.address)} role="button" aria-label={`Select ${h.address}`}>
          <line x1={x} y1={y + 12} x2={hx} y2={hy} className="stroke-border" />
          <circle cx={hx} cy={hy} r={8 + Math.min(n, 8) * 1.5} className={`${risky ? 'fill-destructive/70' : 'fill-primary/70'} ${selected === h.address ? 'stroke-foreground' : 'stroke-background'}`} strokeWidth="2.5" />
          <text x={hx} y={hy + 26} textAnchor="middle" className="fill-foreground font-mono text-[10px]">{h.address.split('.').pop()}</text>
          <text x={hx} y={hy + 38} textAnchor="middle" className="fill-muted-foreground text-[9px]">{(h.hostname || h.vendor).slice(0, 16)}</text></g>; })}
    </g>; })}
  </svg><p className="px-2 pb-1 text-xs text-muted-foreground">Bigger circle = more open ports. Red = has a port worth a second look.</p></div>;
}

function PortTable({ host }: { host: ScanHost }) {
  return <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Port</th><th className="p-2">State</th><th className="p-2">Service</th><th className="p-2">Version</th><th className="p-2">What it means</th></tr></thead>
    <tbody>{host.ports.map(p => { const n = portNote(p); return <tr key={`${p.protocol}${p.port}`} className="border-t align-top"><td className="p-2 font-mono">{p.port}/{p.protocol}</td><td className="p-2"><span className={p.state === 'open' ? 'text-primary' : 'text-muted-foreground'}>{p.state}</span>{p.reason && <div className="text-[11px] text-muted-foreground">{p.reason}</div>}</td><td className="p-2">{p.service}</td><td className="p-2 text-muted-foreground">{[p.product, p.version].filter(Boolean).join(' ')}{p.scripts.map(s => <div key={s.id} className="mt-1 font-mono text-[11px]"><span className="text-primary">{s.id}</span>: {s.output}</div>)}</td><td className={`p-2 text-xs ${n?.level === 'watch' ? 'text-destructive' : 'text-muted-foreground'}`}>{n?.text ?? ''}</td></tr>; })}
    {!host.ports.length && <tr><td colSpan={5} className="p-4 text-muted-foreground">No ports were scanned on this host.</td></tr>}</tbody></table></div>;
}

function HostDetails({ host }: { host: ScanHost }) {
  const rows: [string, string][] = [['Address', host.address], ['Hostname', host.hostname || '—'], ['MAC', host.mac || '—'], ['Vendor', host.vendor || '—'], ['Status', host.status], ['OS guess', host.os ? `${host.os} (${host.osAccuracy}% sure)` : 'not detected — add -O']];
  return <dl className="grid gap-x-6 gap-y-2 rounded-md border p-4 text-sm sm:grid-cols-[10rem_1fr]">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>)}
    {host.hostScripts.map(s => <div key={s.id} className="contents"><dt className="text-primary">{s.id}</dt><dd className="whitespace-pre-wrap font-mono text-xs">{s.output}</dd></div>)}</dl>;
}

const diffLabel: Record<DiffItem['kind'], string> = { 'new-host': 'New device', 'gone-host': 'Device gone', 'new-port': 'Newly open port', 'closed-port': 'Port closed', 'changed-service': 'Service changed' };
function Compare() {
  const [a, setA] = useState<NmapScan | null>(null); const [b, setB] = useState<NmapScan | null>(null); const [err, setErr] = useState('');
  useEffect(() => bindTabLifetime(window, () => { setA(null); setB(null); }), []);
  const load = (set: (s: NmapScan) => void) => async (f?: File) => { if (!f) return; try { set(await readScan(f)); setErr(''); } catch (e) { setErr(e instanceof Error ? e.message : 'Could not read.'); } };
  const items = a && b ? diffScans(a, b) : [];
  return <div data-private-capture className="space-y-4">
    <p className="text-sm text-muted-foreground">Answers "what changed on my network?" Load an older scan and a newer one of the same range.</p>
    <div className="flex flex-wrap items-center gap-2"><FilePick label={a ? 'Older ✓' : 'Older scan'} onFile={load(setA)} /><FilePick label={b ? 'Newer ✓' : 'Newer scan'} onFile={load(setB)} /><Button variant="ghost" onClick={() => { setA(parseNmapXml(demoScanBefore)); setB(parseNmapXml(demoScanAfter)); }}>Try sample pair</Button></div>
    {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
    {a && b && <><p className="text-sm">{items.length} change{items.length === 1 ? '' : 's'} between <span className="font-mono">{a.startedAt || 'older'}</span> and <span className="font-mono">{b.startedAt || 'newer'}</span>.</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((d, i) => <div key={i} className={`rounded-md border-l-4 border p-3 text-sm ${d.kind === 'new-port' || d.kind === 'new-host' ? 'border-l-destructive' : d.kind === 'changed-service' ? 'border-l-primary' : 'border-l-muted-foreground'}`}>
        <div className="text-xs font-medium text-muted-foreground">{diffLabel[d.kind]}</div><div className="font-mono">{d.host}{d.port ? `:${d.port}/${d.protocol}` : ''}</div>
        {d.before && <div className="text-xs text-muted-foreground">was: {d.before}</div>}{d.after && <div className="text-xs">{d.kind === 'changed-service' ? 'now: ' : ''}{d.after}</div>}</div>)}</div></>}
  </div>;
}

function saveText(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Services({ scan, port, onPort }: { scan: NmapScan; port: string; onPort: (p: string) => void }) {
  const rows = useMemo(() => serviceInventory(scan), [scan]);
  return <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Port</th><th className="p-2">Service</th><th className="p-2">Devices</th><th className="p-2">Versions seen</th></tr></thead>
    <tbody>{rows.map(r => <tr key={r.key} className="border-t align-top"><td className="p-2 font-mono">{r.key}</td><td className="p-2">{r.service || '—'}</td><td className="p-2"><Button size="sm" variant={port === String(r.port) ? 'secondary' : 'ghost'} className="h-7" onClick={() => onPort(port === String(r.port) ? '' : String(r.port))} title="Show only these devices">{r.hosts.length} device{r.hosts.length === 1 ? '' : 's'}</Button></td><td className="p-2 text-xs text-muted-foreground">{r.versions.join(' · ') || 'unknown — add -sV'}</td></tr>)}
    {!rows.length && <tr><td colSpan={4} className="p-4 text-muted-foreground">No open ports in this scan.</td></tr>}</tbody></table>
    <p className="p-2 text-xs text-muted-foreground">Several versions of one service can mean some devices need updates.</p></div>;
}

function NextSteps({ scan }: { scan: NmapScan }) {
  const steps = useMemo(() => nextSteps(scan), [scan]);
  return <div className="space-y-3"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Lightbulb className="size-4 text-primary" />Suggestions based on what this scan did and found. Use "Host list" to save live-hosts.txt for -iL.</p>
    {steps.map(s => <div key={s.title} className="rounded-md border p-3"><div className="font-medium">{s.title}</div><p className="text-xs text-muted-foreground">{s.why}</p><CommandBox cmd={s.command} /></div>)}
    {!steps.length && <p className="text-sm text-muted-foreground">This scan already covers the usual follow-ups.</p>}</div>;
}

function Recipes() {
  const [target, setTarget] = useState('192.168.1.0/24');
  const [level, setLevel] = useState<'all' | Recipe['level']>('all');
  const list = recipes.filter(r => level === 'all' || r.level === level);
  return <div className="space-y-4">
    <p className="flex items-center gap-2 text-sm text-muted-foreground"><ListChecks className="size-4 text-primary" />Pick what you want to find out. Each command saves XML you can open in Results.</p>
    <div className="flex flex-wrap items-center gap-2"><Input className="max-w-xs font-mono" value={target} onChange={e => setTarget(e.target.value)} aria-label="Recipe target" placeholder="192.168.1.0/24" />
      {(['all', 'Beginner', 'Intermediate', 'Advanced'] as const).map(l => <Button key={l} size="sm" variant={level === l ? 'secondary' : 'ghost'} aria-pressed={level === l} onClick={() => setLevel(l)}>{l === 'all' ? 'All levels' : l}</Button>)}</div>
    <div className="grid gap-3 md:grid-cols-2">{list.map(r => <div key={r.id} className="rounded-md border p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{r.goal}</span><span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{r.level}{r.root ? ' · admin' : ''}</span></div><p className="mt-1 text-xs text-muted-foreground">{r.explain}</p><CommandBox cmd={recipeCommand(r, target)} /></div>)}</div>
    <p className="text-xs text-muted-foreground">Only scan networks you own or have permission to test.</p>
  </div>;
}

function PortLookup() {
  const [q, setQ] = useState('');
  const rows = lookupPorts(q);
  return <div className="space-y-3">
    <Input className="max-w-sm" value={q} onChange={e => setQ(e.target.value)} placeholder="Port number, service or word (e.g. 3389, ssh, database)" aria-label="Look up a port" />
    <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Port</th><th className="p-2">Nmap name</th><th className="p-2">What it is</th></tr></thead>
      <tbody>{rows.map(p => <tr key={`${p.port}${p.protocol}`} className="border-t"><td className="p-2 font-mono">{p.port}/{p.protocol}</td><td className="p-2 font-mono text-xs">{p.service}</td><td className="p-2 text-muted-foreground">{p.what}</td></tr>)}
      {!rows.length && <tr><td colSpan={3} className="p-4 text-muted-foreground">Not in this list of common ports. Nmap's own list: nmap-services.</td></tr>}</tbody></table></div>
  </div>;
}


