import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, Gauge, ShieldAlert, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommandBox } from '@/components/scan-command-box';
import { scanTypes } from '@/lib/scan/knowledge';
import { explainCommand, explainPasted, nmapOptions, optionArgs, optionGroups, presets, profileCommand, toggleOption, type ChosenOption, type Level } from '@/lib/scan/options';

const levels: ('All' | Level)[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const cleanTarget = (t: string) => t.trim().replace(/[^A-Za-z0-9.:/,\- ]/g, '') || '192.168.1.0/24';

export function Simulator() {
  const [typeId, setTypeId] = useState('syn'); const t = scanTypes.find(s => s.id === typeId) ?? scanTypes[0]!;
  const [outcome, setOutcome] = useState(0); const o = t.outcomes[outcome] ?? t.outcomes[0]!;
  const [chosen, setChosen] = useState<ChosenOption[]>([{ flag: '-sV' }, { flag: '-oX', value: 'scan.xml' }]);
  const [target, setTarget] = useState('192.168.1.0/24');
  const [level, setLevel] = useState<'All' | Level>('Beginner');
  const [q, setQ] = useState('');
  const [pasted, setPasted] = useState('');
  const [sudo, setSudo] = useState(true);

  const profile = profileCommand(t.needsRoot, t.flag, chosen);
  const cmd = ['nmap', t.flag, ...optionArgs(chosen), cleanTarget(target)].filter(Boolean).join(' ');
  const full = profile.needsRoot && sudo ? `sudo ${cmd}` : cmd;
  const explained = useMemo(() => explainCommand(t.flag, t.name, chosen), [t, chosen]);
  const pastedRows = useMemo(() => explainPasted(pasted), [pasted]);
  const visible = nmapOptions.filter(op => chosen.some(c => c.flag === op.flag) || (level === 'All' || op.level === level || (level === 'Intermediate' && op.level === 'Beginner')) && (!q || (op.flag + op.label + op.help).toLowerCase().includes(q.toLowerCase())));
  const setValue = (flag: string, value: string) => setChosen(c => c.map(x => x.flag === flag ? { ...x, value } : x));
  const badge = (v: string, tone: 'ok' | 'mid' | 'hot') => <span className={`rounded-full border px-2 py-0.5 text-[11px] ${tone === 'hot' ? 'border-destructive/50 text-destructive' : tone === 'mid' ? 'text-foreground' : 'text-muted-foreground'}`}>{v}</span>;

  return <div className="space-y-6">
    <section aria-label="Presets"><h2 className="font-medium">Start from a preset <span className="text-xs font-normal text-muted-foreground">(or build from scratch below)</span></h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{presets.map(p => <button key={p.id} className="rounded-md border p-3 text-left text-sm hover:bg-muted" onClick={() => { const st = scanTypes.find(s => s.flag === p.scan); if (st) { setTypeId(st.id); setOutcome(0); } setChosen(p.flags); }}>
        <span className="flex items-center justify-between gap-2"><span className="font-medium">{p.name}</span><span className="rounded-full border px-2 text-[10px] text-muted-foreground">{p.level}</span></span><span className="mt-1 block text-xs text-muted-foreground">{p.why}</span></button>)}</div></section>

    <div className="grid gap-6 lg:grid-cols-2">
      <section><h2 className="font-medium">1. Pick a scan type</h2><div className="mt-2 flex flex-wrap gap-1">{scanTypes.map(s => <Button key={s.id} size="sm" variant={s.id === typeId ? 'secondary' : 'outline'} aria-pressed={s.id === typeId} title={s.name} onClick={() => { setTypeId(s.id); setOutcome(0); }}><span className="font-mono">{s.flag}</span></Button>)}</div>
        <div className="mt-3 rounded-md border p-4"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{t.name}</h3><span className="rounded-full border px-2 text-[11px]">{t.level}</span>{t.needsRoot && <span className="rounded-full border px-2 text-[11px] text-muted-foreground">needs admin/root</span>}</div><p className="mt-1 text-sm text-muted-foreground">{t.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1" aria-label="Port outcome">{t.outcomes.map((x, i) => <Button key={x.state} size="sm" className="h-7" variant={i === outcome ? 'default' : 'ghost'} onClick={() => setOutcome(i)}>If {x.state}</Button>)}</div>
          <ol className="mt-3 space-y-2" aria-label="Packet sequence">{o.steps.map((s, i) => <li key={i} className={`flex ${s.from === 'you' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[80%] rounded-md border px-3 py-2 text-sm ${s.from === 'you' ? 'bg-primary/10' : 'bg-secondary'}`}><div className="font-mono text-xs">{s.from === 'you' ? 'You → target' : 'Target → you'}: <b>{s.label}</b></div>{s.note && <div className="text-xs text-muted-foreground">{s.note}</div>}</div></li>)}</ol>
          <p className="mt-3 text-xs text-muted-foreground">Tip: capture this with Wireshark using <code>tcp.flags.syn==1</code> and open it in the <Link to="/packet-analyzer" className="underline">Packet viewer</Link> to see it for real.</p></div>

        <h2 className="mt-6 font-medium">3. Target</h2><Input className="mt-2 font-mono" value={target} onChange={e => setTarget(e.target.value)} aria-label="Scan target" />
        <p className="mt-1 text-xs text-muted-foreground">A host, name, range (192.168.1.1-50), network (192.168.1.0/24) or several separated by spaces. Only scan what you may.</p>

        <div className="mt-4 rounded-md border p-3" aria-label="Command summary">
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className="flex items-center gap-1 text-muted-foreground"><Volume2 className="size-3.5" />Noise</span>{badge(profile.noise, profile.noise === 'High' ? 'hot' : profile.noise === 'Medium' ? 'mid' : 'ok')}
            <span className="ml-2 flex items-center gap-1 text-muted-foreground"><Gauge className="size-3.5" />Speed</span>{badge(profile.speed, profile.speed === 'Slow' ? 'mid' : 'ok')}
            <span className="ml-2 flex items-center gap-1 text-muted-foreground"><ShieldAlert className="size-3.5" />Admin</span>{badge(profile.needsRoot ? 'needed' : 'not needed', profile.needsRoot ? 'mid' : 'ok')}</div>
          {profile.needsRoot && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" className="accent-primary" checked={sudo} onChange={e => setSudo(e.target.checked)} />Add <code>sudo</code> (Linux/macOS). On Windows, open the terminal as Administrator instead.</label>}
          {profile.warnings.map(w => <p key={w} className="mt-2 flex items-start gap-2 text-xs text-destructive"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{w}</p>)}
          <p className="mt-2 text-[11px] text-muted-foreground">Noise and speed are rough guides for learning, not measurements.</p>
        </div>
        <CommandBox cmd={full} />
        <details className="mt-3 text-sm" open><summary className="cursor-pointer font-medium">Explain this command</summary>
          <dl className="mt-2 divide-y rounded-md border">{explained.map((e, i) => <div key={i} className="grid gap-1 p-2 sm:grid-cols-[11rem_1fr]"><dt className="break-all font-mono text-xs text-primary">{e.arg}</dt><dd className="text-xs text-muted-foreground">{e.meaning}</dd></div>)}<div className="grid gap-1 p-2 sm:grid-cols-[11rem_1fr]"><dt className="break-all font-mono text-xs text-primary">{cleanTarget(target)}</dt><dd className="text-xs text-muted-foreground">What to scan.</dd></div></dl></details>
      </section>

      <section><h2 className="font-medium">2. Add options</h2>
        <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Experience level">{levels.map(l => <Button key={l} size="sm" className="h-7" variant={level === l ? 'secondary' : 'ghost'} aria-pressed={level === l} onClick={() => setLevel(l)}>{l === 'All' ? 'Show all' : l}</Button>)}
          <Input className="ml-auto h-8 max-w-[12rem]" value={q} onChange={e => setQ(e.target.value)} placeholder="Search options…" aria-label="Search options" /></div>
        <p className="mt-1 text-xs text-muted-foreground">{level === 'Beginner' ? 'Showing the essentials. Switch to Intermediate or Advanced for more.' : level === 'Intermediate' ? 'Beginner and intermediate options.' : level === 'Advanced' ? 'Advanced options only.' : `All ${nmapOptions.length} options.`} {chosen.length} selected.</p>
        <div className="mt-2 max-h-[44rem] space-y-2 overflow-y-auto pr-1">{optionGroups.map(g => { const list = visible.filter(op => op.group === g); if (!list.length) return null; const n = list.filter(op => chosen.some(c => c.flag === op.flag)).length;
          return <details key={g} open={n > 0 || !!q || level === 'Beginner'} className="rounded-md border"><summary className="cursor-pointer px-3 py-2 text-sm font-medium">{g} <span className="text-xs font-normal text-muted-foreground">{list.length} options{n ? ` · ${n} selected` : ''}</span></summary>
            <div className="grid gap-1 border-t p-2">{list.map(op => { const on = chosen.find(c => c.flag === op.flag);
              return <div key={op.flag} className={`rounded-md border p-2 text-sm ${on ? 'border-primary/50 bg-primary/5' : ''}`}>
                <label className="flex cursor-pointer items-start gap-2"><input type="checkbox" className="mt-1 accent-primary" checked={!!on} onChange={() => setChosen(c => toggleOption(c, op.flag))} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5"><code className="font-mono text-xs text-primary">{op.flag}</code><span>{op.label}</span>{op.root && <span className="rounded border px-1 text-[10px] text-muted-foreground">admin</span>}{op.noisy && <span className="rounded border border-destructive/50 px-1 text-[10px] text-destructive">noisy</span>}{level === 'All' && <span className="rounded border px-1 text-[10px] text-muted-foreground">{op.level}</span>}</span>{op.help && <span className="block text-xs text-muted-foreground">{op.help}</span>}</span></label>
                {on && op.value !== undefined && <Input className="mt-2 h-8 font-mono text-xs" value={on.value ?? ''} onChange={e => setValue(op.flag, e.target.value)} aria-label={`Value for ${op.flag}`} placeholder={op.value || 'value'} />}
              </div>; })}</div></details>; })}
          {!visible.length && <p className="p-3 text-sm text-muted-foreground">No options match.</p>}</div>
      </section>
    </div>

    <section className="rounded-md border p-4" aria-label="Command explainer"><h2 className="font-medium">Explain any Nmap command</h2><p className="mt-1 text-xs text-muted-foreground">Paste a command you found in a tutorial or script. It is read here and never run or sent anywhere.</p>
      <Input className="mt-2 font-mono text-xs" value={pasted} onChange={e => setPasted(e.target.value)} placeholder="sudo nmap -sS -p- -T4 --script vuln -oX out.xml 10.0.0.5" aria-label="Paste an nmap command" />
      {pasted.trim() && <dl className="mt-3 divide-y rounded-md border">{pastedRows.map((r, i) => <div key={i} className="grid gap-1 p-2 sm:grid-cols-[14rem_1fr]"><dt className="break-all font-mono text-xs text-primary">{r.arg}</dt><dd className={`text-xs ${r.known ? 'text-muted-foreground' : 'text-destructive'}`}>{r.meaning}</dd></div>)}</dl>}</section>
  </div>;
}
