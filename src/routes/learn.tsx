import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { curriculum, type Module } from '@/lib/learn/curriculum';
import { readLearnProgress, saveLearnProgress } from '@/lib/learn/progress';

export const Route = createFileRoute('/learn')({
  head: () => ({ meta: [{ title: 'Learn networking with Pktivo — beginner to CCNA' }, { name: 'description', content: 'A free networking learning path from beginner to professional, covering every CCNA 200-301 exam domain with quizzes and Cisco commands.' }, { property: 'og:title', content: 'Learn networking — beginner to CCNA' }, { property: 'og:description', content: 'Four levels, 22 modules, quizzes and Cisco IOS commands to prepare for the CCNA exam.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: LearnPage,
});

function ModuleCard({ m, n, done, onDone }: { m: Module; n: string; done: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false); const [pick, setPick] = useState<number | null>(null);
  return <article className="rounded-lg border bg-card">
    <button className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-mono ${done ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{done ? <Check className="size-4" /> : n}</span>
      <span className="flex-1 font-medium">{m.title}</span><ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="border-t px-4 pb-5 pt-4 text-sm">
      <p className="leading-7">{m.summary}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">{m.points.map(p => <li key={p}>{p}</li>)}</ul>
      {m.commands && <div className="mt-4 rounded-md border bg-muted p-3"><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Terminal className="size-3" />Cisco IOS</div><pre className="overflow-x-auto font-mono text-xs leading-6">{m.commands.join('\n')}</pre></div>}
      <h4 className="mt-5 font-medium">Check yourself: {m.quiz.q}</h4>
      <div className="mt-3 flex flex-wrap gap-2">{m.quiz.choices.map((c, i) => <Button key={c} size="sm" variant={pick === i ? 'secondary' : 'outline'} onClick={() => { setPick(i); if (i === m.quiz.answer) onDone(); }}>{pick === i && (i === m.quiz.answer ? <Check /> : <X />)}{c}</Button>)}</div>
      {pick !== null && <p role="status" className={`mt-3 ${pick === m.quiz.answer ? 'text-primary' : 'text-destructive'}`}>{pick === m.quiz.answer ? 'Correct! ' : 'Not quite. '}{m.quiz.why}</p>}
    </div>}
  </article>;
}

function LearnPage() {
  const [level, setLevel] = useState(0); const [done, setDone] = useState<Set<string>>(new Set());
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    try { setDone(readLearnProgress(window.localStorage)); }
    catch { setSaveFailed(true); }
  }, []);
  function completeModule(id: string) {
    const next = new Set(done).add(id);
    setDone(next);
    try { setSaveFailed(!saveLearnProgress(window.localStorage, next)); }
    catch { setSaveFailed(true); }
  }
  const total = curriculum.reduce((a, l) => a + l.modules.length, 0); const cur = curriculum[level];
  if (!cur) return null;
  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8"><Link to="/" className="flex items-center gap-2 font-semibold"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft />Back to workspace</Link></Button></header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-2 text-sm text-primary"><BookOpen className="size-4" />Learn networking</div>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">From zero to CCNA-ready</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">A step-by-step path through every CCNA 200-301 exam domain. Start at Beginner, answer each check correctly to tick a module off, and lab the commands in Cisco Packet Tracer.</p>
      <div className="mt-6"><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>Your progress · {saveFailed ? 'Not saved' : 'Saved on this device'}</span><span className="shrink-0">{done.size} / {total} modules</span></div><progress className="mt-2 h-1.5 w-full" max={total} value={done.size} />{saveFailed && <p role="status" className="mt-2 text-xs text-destructive">Your browser couldn’t save progress. It will last only until you leave this page.</p>}</div>
      <nav className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Levels">{curriculum.map((l, i) => { const c = l.modules.filter(m => done.has(m.id)).length; return <button key={l.id} onClick={() => setLevel(i)} className={`rounded-lg border p-3 text-left transition-colors ${i === level ? 'border-primary bg-accent' : 'hover:bg-accent'}`}><span className="text-xs text-muted-foreground">Level {i + 1}</span><span className="block font-medium">{l.name}</span><span className="text-xs text-muted-foreground">{c}/{l.modules.length} done</span></button>; })}</nav>
      <section className="mt-8"><h2 className="text-xl font-semibold">{cur.name}</h2><p className="mt-1 text-sm text-muted-foreground">{cur.goal}</p>
        <div className="mt-5 space-y-3">{cur.modules.map((m, i) => <ModuleCard key={m.id} m={m} n={`${level + 1}.${i + 1}`} done={done.has(m.id)} onDone={() => completeModule(m.id)} />)}</div>
        <div className="mt-8 flex justify-between">{level > 0 ? <Button variant="ghost" onClick={() => setLevel(level - 1)}>← {curriculum[level - 1]?.name}</Button> : <span />}{level < curriculum.length - 1 && <Button onClick={() => { setLevel(level + 1); window.scrollTo({ top: 0 }); }}>Next: {curriculum[level + 1]?.name} →</Button>}</div>
      </section>
      <p className="mt-12 border-t pt-6 text-xs text-muted-foreground">Pktivo is not affiliated with Cisco. CCNA is a trademark of Cisco Systems. Always check the official exam topics before booking your exam.</p>
    </main>
  </div>;
}
