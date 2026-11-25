import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, FileUp, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CaptureParser } from '@/lib/netlens/capture-parser';
import { Dissector } from '@/lib/netlens/dissect';
import { compareCaptures } from '@/lib/netlens/comparison';
import { formatBytes } from '@/lib/netlens/format';
import { bindTabLifetime } from '@/lib/netlens/tab-lifetime';
import type { Packet } from '@/lib/netlens/types';

interface Capture { name: string; packets: Packet[] }
const delta = (a: number, b: number, digits = 0) => `${b > a ? '+' : ''}${(b - a).toFixed(digits)}`;
const timing = (n: number | null) => n === null ? 'Not observed' : `${n.toFixed(2)} ms`;

export function CaptureComparison({ current, currentName, isDemo }: { current: Packet[]; currentName: string; isDemo: boolean }) {
  const [captures, setCaptures] = useState<[Capture | null, Capture | null]>([null, null]);
  const [busy, setBusy] = useState<[boolean, boolean]>([false, false]);
  const [errors, setErrors] = useState<[string, string]>(['', '']);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const generations = useRef([0, 0]);
  const readers = useRef<Array<ReadableStreamDefaultReader<Uint8Array> | null>>([]);
  const result = useMemo(() => captures[0] && captures[1] ? compareCaptures(captures[0].packets, captures[1].packets) : null, [captures]);
  function invalidate(slot: number) {
    generations.current[slot] = (generations.current[slot] ?? 0) + 1;
    const reader = readers.current[slot]; if (reader) void reader.cancel().catch(() => {});
    readers.current[slot] = null;
  }
  useEffect(() => {
    const clear = () => { invalidate(0); invalidate(1); setCaptures([null, null]); setBusy([false, false]); setErrors(['', '']); inputs.current.forEach(input => { if (input) input.value = ''; }); };
    const unbind = bindTabLifetime(window, clear);
    return () => { invalidate(0); invalidate(1); unbind(); };
  }, []);
  function clearSlot(slot: 0 | 1) { invalidate(slot); setCaptures(c => slot === 0 ? [null, c[1]] : [c[0], null]); setErrors(e => slot === 0 ? ['', e[1]] : [e[0], '']); setBusy(b => slot === 0 ? [false, b[1]] : [b[0], false]); }
  async function open(file: File, slot: 0 | 1) {
    clearSlot(slot);
    const generation = generations.current[slot];
    setBusy(b => slot === 0 ? [true, b[1]] : [b[0], true]);
    const reader = file.stream().getReader(); readers.current[slot] = reader;
    try {
      const parser = new CaptureParser(), dissector = new Dissector(), packets: Packet[] = [];
      for (;;) { const { done, value } = await reader.read(); if (generation !== generations.current[slot]) return; if (done) break; packets.push(...parser.push(value).map(p => dissector.dissect(p))); }
      if (parser.detectedFormat === 'unknown' || !packets.length) throw new Error('No readable packets.');
      if (generation !== generations.current[slot]) return;
      const capture = { name: file.name, packets };
      setCaptures(c => slot === 0 ? [capture, c[1]] : [c[0], capture]);
    } catch { if (generation === generations.current[slot]) setErrors(e => slot === 0 ? ['Unable to read this file. Choose a PCAP or PCAPNG with packets.', e[1]] : [e[0], 'Unable to read this file. Choose a PCAP or PCAPNG with packets.']); }
    finally { reader.releaseLock(); if (generation === generations.current[slot]) { readers.current[slot] = null; setBusy(b => slot === 0 ? [false, b[1]] : [b[0], false]); } }
  }
  return <section className="rr-block rr-mask px-4 pb-8 sm:px-6" data-private="true" onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} onDrop={e => { e.preventDefault(); e.stopPropagation(); }}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div><h2 className="text-xl font-semibold">Compare captures</h2><p className="mt-1 text-sm text-muted-foreground">Two recordings. One side-by-side view.</p></div><Button variant="outline" size="sm" disabled={!captures[0] || !captures[1] || busy.some(Boolean)} onClick={() => setCaptures(c => [c[1], c[0]])}><ArrowLeftRight />Swap A and B</Button></div>
    <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" /><p>Files are read only on this device, never uploaded or saved. Closing this tab clears them.</p></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{([0, 1] as const).map(slot => {
      const capture = captures[slot];
      return <div key={slot} className="min-w-0 rounded-lg border bg-card p-4" onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) void open(f, slot); }}>
        <div className="flex items-center justify-between"><h3 className="font-medium">Capture {slot === 0 ? 'A · Baseline' : 'B · Comparison'}</h3><Button size="icon" variant="ghost" className="size-8" aria-label={`Clear capture ${slot === 0 ? 'A' : 'B'}`} title="Clear capture" disabled={!capture && !busy[slot]} onClick={() => clearSlot(slot)}><Trash2 /></Button></div>
        <p className="mt-3 break-all text-sm">{capture?.name ?? 'No file selected'}</p><p className="mt-1 text-xs text-muted-foreground">{capture ? `${capture.packets.length.toLocaleString()} packets` : 'PCAP or PCAPNG'}</p>
        <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant={capture ? 'outline' : 'default'} disabled={busy[slot]} onClick={() => inputs.current[slot]?.click()}><FileUp />{capture ? 'Replace file' : `Open capture ${slot === 0 ? 'A' : 'B'}`}</Button>{current.length > 0 && <Button variant="ghost" size="sm" disabled={busy[slot]} onClick={() => { clearSlot(slot); const c = { name: currentName, packets: current }; setCaptures(prev => slot === 0 ? [c, prev[1]] : [prev[0], c]); }}>{isDemo ? 'Use workspace sample' : 'Use open capture'}</Button>}</div>
        <input type="file" accept=".pcap,.pcapng,.cap" className="hidden" aria-label={`Comparison file ${slot === 0 ? 'A' : 'B'}`} ref={el => { inputs.current[slot] = el; }} onChange={e => { const f = e.target.files?.[0]; if (f) void open(f, slot); e.target.value = ''; }} />
        {busy[slot] && <p role="status" className="mt-3 text-xs text-muted-foreground">Reading capture…</p>}{errors[slot] && <p role="alert" className="mt-3 text-xs text-destructive">{errors[slot]}</p>}
      </div>;
    })}</div>
    {!result && <p className="mt-8 py-8 text-center text-sm text-muted-foreground">Select both captures to see what changed.</p>}
    {result && <>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">Compare recordings of the same activity with similar capture settings. Different durations or filters can change totals; a difference is not proof of a problem.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><caption className="mb-3 text-left text-lg font-medium">Traffic overview</caption><thead className="border-b text-xs text-muted-foreground"><tr><th className="py-3 pr-3">Measure</th><th className="px-3 py-3">A</th><th className="px-3 py-3">B</th><th className="py-3 pl-3">B − A</th></tr></thead><tbody>{[
        ['Packets', result.left.stats.packets, result.right.stats.packets, 0, ''], ['Data (bytes)', result.left.stats.bytes, result.right.stats.bytes, 0, ''], ['Duration', result.left.stats.duration, result.right.stats.duration, 2, ' s'], ['Packets / second', result.left.stats.avgPps, result.right.stats.avgPps, 2, ''], ['Bits / second', result.left.stats.avgBps, result.right.stats.avgBps, 0, ''], ['Flagged packets', result.left.flagged, result.right.flagged, 0, ''],
      ].map(row => { const [label, a, b, digits, unit] = row as [string, number, number, number, string]; return <tr key={label} className="border-b"><th className="py-3 pr-3 font-normal">{label}</th><td className="px-3 py-3 font-mono text-xs">{a.toFixed(digits)}{unit}</td><td className="px-3 py-3 font-mono text-xs">{b.toFixed(digits)}{unit}</td><td className="py-3 pl-3 font-mono text-xs">{delta(a, b, digits)}{unit}</td></tr>; })}</tbody></table></div>
      <p className="mt-2 text-xs text-muted-foreground">Data volume: {formatBytes(result.left.stats.bytes)} in A · {formatBytes(result.right.stats.bytes)} in B</p>
      <h3 className="mt-8 text-lg font-medium">Observed response times</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{(['dns', 'tcp'] as const).map(kind => { const a = result.left.timings[kind], b = result.right.timings[kind]; return <div key={kind} className="border-l-2 border-primary pl-4"><h4 className="text-sm font-medium">{kind === 'dns' ? 'DNS query → reply' : 'TCP SYN → SYN-ACK'}</h4><p className="mt-2 font-mono text-sm">A: {timing(a.averageMs)}<br />B: {timing(b.averageMs)}</p><p className="mt-2 text-xs text-muted-foreground">{a.pairs} matched pairs in A · {b.pairs} in B</p>{a.averageMs !== null && b.averageMs !== null && <p className="mt-1 text-xs">Difference: {delta(a.averageMs, b.averageMs, 2)} ms</p>}</div>; })}</div>
      <p className="mt-3 text-xs text-muted-foreground">Averages of matched packets visible in each file, not full website load times. Missing packets and retries can affect these measurements.</p>
      <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[400px] text-left text-sm"><caption className="mb-3 text-left text-lg font-medium">Protocol mix</caption><thead className="border-b text-xs text-muted-foreground"><tr><th className="py-3">Protocol</th><th className="p-3">A · packets / share</th><th className="p-3">B · packets / share</th><th className="py-3">Share change</th></tr></thead><tbody>{result.protocols.map(p => <tr key={p.name} className="border-b"><th className="py-3 font-normal">{p.name}</th><td className="p-3 font-mono text-xs">{p.before} / {p.beforeShare.toFixed(1)}%</td><td className="p-3 font-mono text-xs">{p.after} / {p.afterShare.toFixed(1)}%</td><td className="py-3 font-mono text-xs">{delta(p.beforeShare, p.afterShare, 1)} pp</td></tr>)}</tbody></table></div>
      <h3 className="mt-8 text-lg font-medium">Warning changes</h3><p className="mt-1 text-xs text-muted-foreground">Counts are packets matching each rule, not confirmed threats. One packet can match several rules.</p>
      {result.warnings.length ? <div className="mt-3 divide-y">{result.warnings.map(w => <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="min-w-0 flex-1">{w.title}</span><span className="font-mono text-xs">A: {w.before} · B: {w.after} · {delta(w.before, w.after)}</span></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Neither capture matched the current warning rules. This does not guarantee safe traffic.</p>}
    </>}
  </section>;
}