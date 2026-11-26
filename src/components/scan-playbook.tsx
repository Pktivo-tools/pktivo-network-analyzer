import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommandBox } from '@/components/scan-command-box';
import { nseCategories, nseScripts, riskyCategories, scriptCommand, scriptsFor, type NseCategory } from '@/lib/scan/knowledge';
import { nmapOptions, optionGroups, type Level } from '@/lib/scan/options';
import { openPorts, type NmapScan } from '@/lib/scan/nmap-xml';

export function Playbook({ scan }: { scan: NmapScan | null }) {
  const [mode, setMode] = useState<'scripts' | 'reference'>('scripts');
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-1" role="group" aria-label="Playbook section"><Button size="sm" variant={mode === 'scripts' ? 'secondary' : 'outline'} aria-pressed={mode === 'scripts'} onClick={() => setMode('scripts')}>Scripts ({nseScripts.length})</Button><Button size="sm" variant={mode === 'reference' ? 'secondary' : 'outline'} aria-pressed={mode === 'reference'} onClick={() => setMode('reference')}>All Nmap options ({nmapOptions.length})</Button></div>
    {mode === 'scripts' ? <Scripts scan={scan} /> : <Reference />}
  </div>;
}

const catNote: Record<NseCategory, string> = { default: 'Run by -sC', safe: 'Won’t crash or attack', discovery: 'Learns about the network', version: 'Extends -sV', vuln: 'Checks for known flaws', auth: 'Authentication checks', broadcast: 'Finds hosts by broadcast', external: 'Talks to third parties', brute: 'Password guessing', intrusive: 'May disturb the target', exploit: 'Tries to exploit', dos: 'May crash services', fuzzer: 'Sends odd input', malware: 'Detects backdoors' };

function Scripts({ scan }: { scan: NmapScan | null }) {
  const detected = useMemo(() => [...new Set(scan?.hosts.flatMap(h => openPorts(h).map(p => p.service)) ?? [])], [scan]);
  const ports = useMemo(() => [...new Set(scan?.hosts.flatMap(h => openPorts(h).map(p => p.port)) ?? [])].sort((a, b) => a - b), [scan]);
  const [intrusive, setIntrusive] = useState(false); const [q, setQ] = useState(''); const [picked, setPicked] = useState<string[]>([]); const [cat, setCat] = useState<NseCategory | 'all'>('all'); const [matchOnly, setMatchOnly] = useState(true);
  const base = detected.length && matchOnly ? scriptsFor(detected, intrusive) : nseScripts.filter(s => intrusive || !s.categories.some(c => riskyCategories.includes(c)));
  const list = base.filter(s => (cat === 'all' || s.categories.includes(cat)) && (!q || (s.id + s.what + (s.cve ?? '') + s.services.join(' ') + s.categories.join(' ')).toLowerCase().includes(q.toLowerCase())));
  const hidden = nseScripts.length - base.length;
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">{detected.length ? <>Services found in your scan: <span className="font-mono">{detected.join(', ')}</span>.</> : 'Open a scan in Results to match scripts to your services, or browse them all.'} Scripts add detail after ports are found; you pick them with <code>--script</code>.</p>
    <div className="flex flex-wrap items-center gap-3"><Input className="max-w-xs" placeholder="Search script, service, category or CVE…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search scripts" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={intrusive} onChange={e => setIntrusive(e.target.checked)} />Include intrusive, brute-force, exploit and DoS</label>
      {detected.length > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={matchOnly} onChange={e => setMatchOnly(e.target.checked)} />Only my scan’s services</label>}</div>
    <div className="flex flex-wrap gap-1" role="group" aria-label="Script category"><Button size="sm" className="h-7" variant={cat === 'all' ? 'secondary' : 'ghost'} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All</Button>{nseCategories.map(c => <Button key={c} size="sm" className={`h-7 ${riskyCategories.includes(c) ? 'text-destructive' : ''}`} variant={cat === c ? 'secondary' : 'ghost'} aria-pressed={cat === c} title={catNote[c]} onClick={() => setCat(c)}>{c}</Button>)}</div>
    {cat !== 'all' && <p className="text-xs text-muted-foreground"><b>{cat}</b>: {catNote[cat]}. Run the whole category with <code>--script {cat}</code>.</p>}
    {hidden > 0 && !intrusive && <p className="text-xs text-muted-foreground">{hidden} scripts hidden (intrusive, brute-force, exploit, DoS{detected.length && matchOnly ? ' or not matching your services' : ''}).</p>}
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{list.map(s => <label key={s.id} className="flex cursor-pointer gap-2 rounded-md border p-3 text-sm hover:bg-muted"><input type="checkbox" className="mt-1 accent-primary" checked={picked.includes(s.id)} onChange={e => setPicked(e.target.checked ? [...picked, s.id] : picked.filter(x => x !== s.id))} /><span className="min-w-0"><span className="font-mono">{s.id}</span><span className="block text-xs text-muted-foreground">{s.what}</span><span className="mt-1 flex flex-wrap gap-1">{s.categories.map(c => <span key={c} className={`rounded border px-1 text-[10px] ${riskyCategories.includes(c) ? 'text-destructive' : 'text-muted-foreground'}`}>{c}</span>)}{s.cve && <span className="rounded border px-1 text-[10px] text-primary">{s.cve}</span>}</span></span></label>)}
      {!list.length && <p className="text-sm text-muted-foreground">No scripts match.</p>}</div>
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{picked.length} selected</span>{picked.length > 0 && <Button size="sm" variant="ghost" className="h-7" onClick={() => setPicked([])}>Clear</Button>}</div>
    <CommandBox cmd={scriptCommand(picked, ports.slice(0, 20), scan?.hosts[0]?.address ?? '192.168.1.0/24')} />
    <p className="text-xs text-muted-foreground">Scripts are listed from Nmap’s own library plus a few third-party ones (marked external). Check <code>nmap --script-help &lt;name&gt;</code> for the full details, and only run intrusive scripts with permission.</p>
  </div>;
}

function Reference() {
  const [q, setQ] = useState(''); const [level, setLevel] = useState<'All' | Level>('All');
  const list = nmapOptions.filter(o => (level === 'All' || o.level === level) && (!q || (o.flag + o.label + o.help + o.group).toLowerCase().includes(q.toLowerCase())));
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Every common Nmap option in one searchable list. Scan types (<code>-sS</code>, <code>-sU</code>…) are in the Scan simulator; scripts are in the other section.</p>
    <div className="flex flex-wrap items-center gap-2"><Input className="max-w-xs" value={q} onChange={e => setQ(e.target.value)} placeholder="Search flag or word, e.g. timing, firewall, -oX" aria-label="Search options" />{(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(l => <Button key={l} size="sm" className="h-7" variant={level === l ? 'secondary' : 'ghost'} aria-pressed={level === l} onClick={() => setLevel(l)}>{l}</Button>)}</div>
    {optionGroups.map(g => { const rows = list.filter(o => o.group === g); if (!rows.length) return null;
      return <section key={g}><h3 className="mb-1 font-medium">{g}</h3><div className="divide-y rounded-md border">{rows.map(o => { const ex = `nmap ${o.flag}${o.value ? ' ' + o.value : ''} <target>`;
        return <div key={o.flag} className="grid gap-1 p-2 text-sm sm:grid-cols-[13rem_1fr]"><div><code className="font-mono text-xs text-primary">{o.flag}{o.value ? ` <${o.value}>` : ''}</code><div className="mt-0.5 flex gap-1 text-[10px] text-muted-foreground"><span>{o.level}</span>{o.root && <span>· admin</span>}{o.noisy && <span className="text-destructive">· noisy</span>}</div></div>
          <div><div>{o.label}</div>{o.help && <div className="text-xs text-muted-foreground">{o.help}</div>}<code className="mt-1 block break-all font-mono text-[11px] text-muted-foreground">{ex}</code></div></div>; })}</div></section>; })}
    {!list.length && <p className="text-sm text-muted-foreground">No options match.</p>}
  </div>;
}
