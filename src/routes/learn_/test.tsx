import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ClipboardCheck, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { curriculum } from '@/lib/learn/curriculum';
import { questionsFor } from '@/lib/learn/course';
import type { Quiz } from '@/lib/learn/curriculum';

export const Route = createFileRoute('/learn_/test')({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: 'Networking test — Pktivo Learn' }, { name: 'description', content: 'Test yourself with questions from the Pktivo networking reading course, from beginner to CCNA level.' }, { property: 'og:title', content: 'Networking test — Pktivo Learn' }, { property: 'og:description', content: 'Questions from every level of the reading course, with explanations.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: TestPage,
});

type Item = Quiz & { module: string; level: string };
const bank: Item[] = curriculum.flatMap(l => l.modules.flatMap(m => questionsFor(m.id, m.quiz).map(q => ({ ...q, module: m.title, level: l.name }))));

function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; } return b; }

function TestPage() {
  const [scope, setScope] = useState<string | null>(null); const [seed, setSeed] = useState(0);
  const [i, setI] = useState(0); const [pick, setPick] = useState<number | null>(null); const [wrong, setWrong] = useState<Item[]>([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const qs = useMemo(() => scope === null ? [] : shuffle(bank.filter(q => scope === 'all' || q.level === scope)).slice(0, 20), [scope, seed]);
  const start = (s: string) => { setScope(s); setSeed(seed + 1); setI(0); setPick(null); setWrong([]); };
  const q = qs[i]; const finished = scope !== null && i >= qs.length;
  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8"><Link to="/" className="flex items-center gap-2 font-semibold"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link><Button asChild variant="ghost" size="sm"><Link to="/learn"><ArrowLeft />Back to reading</Link></Button></header>
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-2 text-sm text-primary"><ClipboardCheck className="size-4" />Learn · Test</div>
      {scope === null && <>
        <h1 className="mt-3 text-3xl font-semibold">Test what you read</h1>
        <p className="mt-3 text-muted-foreground">Up to 20 random questions from the reading course. You get the explanation after each answer, and a list of topics to reread at the end.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">{curriculum.map(l => <button key={l.id} onClick={() => start(l.name)} className="rounded-lg border p-4 text-left hover:border-primary hover:bg-accent"><span className="block font-medium">{l.name}</span><span className="text-xs text-muted-foreground">{bank.filter(q => q.level === l.name).length} questions in the pool</span></button>)}</div>
        <Button className="mt-3 w-full" onClick={() => start('all')}>Full test — all levels</Button>
      </>}
      {q && <>
        <div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>{q.level} · {q.module}</span><span>Question {i + 1} / {qs.length}</span></div>
        <progress className="mt-2 h-1.5 w-full" max={qs.length} value={i} />
        <h2 className="mt-6 text-xl font-semibold">{q.q}</h2>
        <div className="mt-4 grid gap-2">{q.choices.map((c, k) => { const show = pick !== null; const right = k === q.answer; return <button key={c} disabled={show} onClick={() => { setPick(k); if (k !== q.answer) setWrong(w => [...w, q]); }} className={`flex items-center gap-2 rounded-md border p-3 text-left text-sm ${show && right ? 'border-primary bg-accent' : ''} ${show && pick === k && !right ? 'border-destructive text-destructive' : ''} ${!show ? 'hover:bg-accent' : ''}`}>{show && right && <Check className="size-4 text-primary" />}{show && pick === k && !right && <X className="size-4" />}{c}</button>; })}</div>
        {pick !== null && <><p role="status" className={`mt-4 text-sm ${pick === q.answer ? 'text-primary' : 'text-destructive'}`}>{pick === q.answer ? 'Correct! ' : 'Not quite. '}<span className="text-foreground">{q.why}</span></p>
          <Button className="mt-5" onClick={() => { setI(i + 1); setPick(null); }}>{i + 1 < qs.length ? 'Next question →' : 'See results'}</Button></>}
      </>}
      {finished && <>
        <h1 className="mt-3 text-3xl font-semibold">{qs.length - wrong.length} / {qs.length} correct</h1>
        <p className="mt-2 text-muted-foreground">{wrong.length === 0 ? 'Perfect score — try a harder level next.' : (qs.length - wrong.length) / qs.length >= 0.8 ? 'Great work. Reread the topics below to close the gaps.' : 'Keep going — reread these topics and try again.'}</p>
        {wrong.length > 0 && <ul className="mt-5 space-y-2">{wrong.map(w => <li key={w.q} className="rounded-md border p-3 text-sm"><span className="text-xs text-muted-foreground">Reread: {w.level} · {w.module}</span><span className="mt-1 block">{w.q}</span><span className="mt-1 block text-primary">Answer: {w.choices[w.answer]}</span></li>)}</ul>}
        <div className="mt-6 flex gap-2"><Button onClick={() => start(scope)}><RotateCcw />Try again</Button><Button variant="outline" onClick={() => setScope(null)}>Pick another level</Button><Button asChild variant="ghost"><Link to="/learn">Back to reading</Link></Button></div>
      </>}
    </main>
  </div>;
}
