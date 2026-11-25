import { useEffect, useState } from 'react';
import { Check, Lightbulb, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { makeSubnetQuestion, checkSubnetAnswer, subnet, type PracticeLevel, type SubnetQuestion } from '@/lib/learn/subnetting';

export function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.10.77');
  const [prefix, setPrefix] = useState(26);
  let result: ReturnType<typeof subnet> | null = null;
  let error = '';
  try { result = subnet(ip, prefix); } catch (e) { error = e instanceof Error ? e.message : 'Check the address.'; }
  return <section className="mt-10 border-y py-6" aria-labelledby="calculator-title">
    <h2 id="calculator-title" className="text-xl font-semibold">See the subnet</h2>
    <div className="mt-4 flex flex-wrap items-end gap-4">
      <label className="min-w-0 flex-1 text-sm">IPv4 address<Input className="mt-2 font-mono" value={ip} onChange={e => setIp(e.target.value)} aria-invalid={Boolean(error)} /></label>
      <label className="text-sm">Prefix<select aria-label="Subnet prefix" className="mt-2 block h-9 rounded-md border bg-background px-3 text-foreground" value={prefix} onChange={e => setPrefix(Number(e.target.value))}>{Array.from({ length: 33 }, (_, p) => <option key={p} value={p}>/{p}</option>)}</select></label>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {result && <>
      <div className="mt-5 grid gap-2" aria-label="Address bits, network bits highlighted">
        {Array.from({ length: 4 }, (_, octet) => <div key={octet} className="flex items-center gap-2"><span className="w-14 shrink-0 text-xs text-muted-foreground">Octet {octet + 1}</span><div className="grid min-w-0 flex-1 grid-cols-8 gap-1">{result.bits.slice(octet * 8, octet * 8 + 8).split('').map((bit, j) => <span key={j} className={`flex h-8 items-center justify-center rounded-sm border font-mono text-xs ${octet * 8 + j < prefix ? 'border-primary/30 bg-accent text-primary' : 'bg-muted text-muted-foreground'}`}>{bit}</span>)}</div></div>)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground"><span className="text-primary">{prefix} network bits</span> · {32 - prefix} host bits</p>
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[
        ['Subnet mask', result.mask], ['Network address', result.network], ['Broadcast', result.broadcast ?? 'None for this prefix'], ['First usable', result.first], ['Last usable', result.last], ['Usable addresses', result.hosts.toLocaleString()],
      ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-mono text-sm">{value}</dd></div>)}</dl>
      <p className="mt-4 text-xs text-muted-foreground">{prefix === 31 ? '/31 assumes a supported point-to-point link; both addresses are endpoints.' : prefix === 32 ? '/32 identifies one host, not an ordinary LAN.' : `${result.size.toLocaleString()} total addresses, minus network and broadcast = ${result.hosts.toLocaleString()} usable.`}</p>
    </>}
  </section>;
}

export function SubnetPractice() {
  const [level, setLevel] = useState<PracticeLevel>('Beginner');
  const [question, setQuestion] = useState<SubnetQuestion | null>(null);
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(false);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  useEffect(() => { setQuestion(makeSubnetQuestion('Beginner')); }, []);
  const correct = question ? checkSubnetAnswer(input, question.answer) : false;
  function next(l = level) { setQuestion(makeSubnetQuestion(l)); setInput(''); setAnswered(false); setHint(false); }
  return <section className="mt-10" aria-labelledby="practice-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="practice-title" className="text-xl font-semibold">Subnetting practice</h2><span className="text-xs text-muted-foreground">{score.correct} / {score.total} correct this visit</span></div>
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Practice difficulty">{(['Beginner', 'Intermediate', 'Advanced', 'Professional'] as const).map(l => <Button key={l} variant={l === level ? 'secondary' : 'outline'} size="sm" aria-pressed={l === level} onClick={() => { setLevel(l); next(l); setScore({ correct: 0, total: 0 }); }}>{l}</Button>)}</div>
    <p className="mt-3 text-xs text-muted-foreground">{level === 'Beginner' ? 'Masks and host counts' : level === 'Intermediate' ? 'Masks, host counts, network and broadcast addresses' : level === 'Advanced' ? 'Mixed prefixes, address ranges and LAN sizing' : 'Multi-step VLSM, route summaries, troubleshooting, wildcard masks and IPv6'}</p>
    {question && <form className="mt-5 rounded-lg border bg-card p-4 sm:p-6" onSubmit={e => { e.preventDefault(); if (!input.trim() || answered) return; setAnswered(true); setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 })); }}>
      <h3 className="text-lg font-medium">{question.prompt}</h3>
      {question.topic && <p className="mt-2 text-xs text-primary">{question.topic}</p>}
      <label className="mt-4 block text-sm">Your answer<Input className="mt-2 font-mono" value={input} disabled={answered} onChange={e => setInput(e.target.value)} placeholder={level === 'Professional' ? '' : question.answer.startsWith('/') ? '/26' : question.answer.includes('.') ? '192.168.1.0' : '62'} autoComplete="off" /></label>
      <div className="mt-4 flex flex-wrap gap-2">{!answered ? <Button type="submit" disabled={!input.trim()}><Check />Check answer</Button> : <Button type="button" onClick={() => next()}>Next question →</Button>}<Button type="button" variant="ghost" onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb />{hint ? 'Hide hint' : 'Show hint'}</Button><Button type="button" variant="ghost" size="icon" aria-label="Reset practice" title="Reset practice" onClick={() => { next(); setScore({ correct: 0, total: 0 }); }}><RotateCcw /></Button></div>
      {hint && <p className="mt-4 text-sm text-muted-foreground">{question.hint}</p>}
      {answered && <div role="status" className="mt-4 border-t pt-4"><p className={`font-medium ${correct ? 'text-primary' : 'text-destructive'}`}>{correct ? 'Correct!' : `Not quite — the answer is ${question.answer}.`}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{question.explanation}</p></div>}
    </form>}
  </section>;
}