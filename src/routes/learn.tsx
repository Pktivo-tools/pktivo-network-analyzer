import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, ClipboardCheck, Lightbulb, Network, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';
import { curriculum, type Module } from '@/lib/learn/curriculum';
import { course } from '@/lib/learn/course';
import { readLearnProgress, saveLearnProgress } from '@/lib/learn/progress';

export const Route = createFileRoute('/learn')({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: 'Learn networking with Pktivo — beginner to CCNA' }, { name: 'description', content: 'A free networking learning path from beginner to professional, covering every CCNA 200-301 exam domain with quizzes and Cisco commands.' }, { property: 'og:title', content: 'Learn networking with Pktivo — beginner to CCNA' }, { property: 'og:description', content: 'Four levels, 22 reading modules, a separate test and Cisco IOS commands to prepare for the CCNA exam.' }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: 'https://pktivo.com/learn' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: LearnPage,
});

function ModuleCard({ m, n, done, onDone, initiallyOpen = false }: { m: Module; n: string; done: boolean; onDone: () => void; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen); const c = course[m.id];
  return <article id={m.id} className="scroll-mt-6 rounded-lg border bg-card">
    <button className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-mono ${done ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{done ? <Check className="size-4" /> : n}</span>
      <span className="flex-1"><span className="block font-medium">{m.title}</span><span className="text-xs text-muted-foreground">{(c?.lessons.length ?? 0) + 1} short readings{done ? ' · Read' : ''}</span></span><ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="border-t px-4 pb-5 pt-4 text-sm">
      {c && <div className="rounded-md border-l-2 border-primary bg-accent px-3 py-2"><div className="flex items-center gap-1.5 text-xs font-medium text-primary"><Lightbulb className="size-3" />In simple words</div><p className="mt-1 leading-6">{c.simple}</p></div>}
      <p className="mt-4 leading-7">{m.summary}</p>
      {c?.lessons.map((l, i) => <section key={l.heading} className="mt-5"><h4 className="font-medium">{i + 1}. {l.heading}</h4><p className="mt-1.5 leading-7 text-muted-foreground">{l.body}</p></section>)}
      <h4 className="mt-6 font-medium">Remember</h4>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">{m.points.map(p => <li key={p}>{p}</li>)}</ul>
      {m.commands && <div className="mt-4 rounded-md border bg-muted p-3"><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Terminal className="size-3" />Cisco IOS — try in Packet Tracer</div><pre className="overflow-x-auto font-mono text-xs leading-6">{m.commands.join('\n')}</pre></div>}
      <div className="mt-6 flex justify-end"><Button size="sm" variant={done ? 'secondary' : 'default'} onClick={onDone} disabled={done}>{done ? <><Check />Read</> : 'Mark as read'}</Button></div>
    </div>}
  </article>;
}

function LearnPage() {
  const [level, setLevel] = useState(0); const [done, setDone] = useState<Set<string>>(new Set());
  const [saveFailed, setSaveFailed] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const li = curriculum.findIndex(l => l.modules.some(m => m.id === id));
    if (li >= 0) { setLevel(li); setTarget(id); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50); }
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
  const completed = curriculum.flatMap(l => l.modules).filter(m => done.has(m.id)).length;
  if (!cur) return null;
  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8"><Link to="/" className="flex items-center gap-2 font-semibold"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link><Button asChild variant="ghost" size="sm"><Link to="/packet-analyzer"><ArrowLeft />Packet viewer</Link></Button></header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-2 text-sm text-primary"><BookOpen className="size-4" />Learn networking</div>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">From zero to CCNA-ready</h1>
      <Button asChild variant="link" size="sm" className="mt-2 px-0"><Link to="/glossary"><BookOpen />Networking glossary →</Link></Button>
      <p className="mt-3 max-w-2xl text-muted-foreground">A step-by-step path through every CCNA 200-301 exam domain. Read each module, mark it as read, then check what you remember in the separate test.</p>
      <Link to="/learn/test" className="mt-5 flex items-center gap-3 rounded-lg border border-primary/40 bg-accent p-4 hover:border-primary"><ClipboardCheck className="size-5 text-primary" /><span className="flex-1"><span className="block font-medium">Take the test</span><span className="text-xs text-muted-foreground">Questions drawn from this reading course — by level or everything at once.</span></span><span className="text-sm text-primary">Start →</span></Link>
      <section className="mt-6 border-y py-5"><div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><h2 className="flex items-center gap-2 font-medium"><Network className="size-4 text-primary" />Subnetting focus course</h2><p className="mt-1 text-sm text-muted-foreground">IPv4, VLSM, route summaries and IPv6 · 12 lessons, professional practice and a scenario exam.</p></div><Button asChild variant="outline" size="sm"><Link to="/learn/subnetting">Open subnetting course →</Link></Button></div></section>
      <div className="mt-6"><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>Your progress · {saveFailed ? 'Not saved' : 'Saved on this device'}</span><span className="shrink-0">{completed} / {total} modules read</span></div><progress className="mt-2 h-1.5 w-full" max={total} value={completed} />{saveFailed && <p role="status" className="mt-2 text-xs text-destructive">Your browser couldn’t save progress. It will last only until you leave this page.</p>}</div>
      <nav className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Levels">{curriculum.map((l, i) => { const c = l.modules.filter(m => done.has(m.id)).length; return <button key={l.id} onClick={() => setLevel(i)} className={`rounded-lg border p-3 text-left transition-colors ${i === level ? 'border-primary bg-accent' : 'hover:bg-accent'}`}><span className="text-xs text-muted-foreground">Level {i + 1}</span><span className="block font-medium">{l.name}</span><span className="text-xs text-muted-foreground">{c}/{l.modules.length} done</span></button>; })}</nav>
      <section className="mt-8"><h2 className="text-xl font-semibold">{cur.name}</h2><p className="mt-1 text-sm text-muted-foreground">{cur.goal}</p>
        <div className="mt-5 space-y-3">{cur.modules.map((m, i) => <ModuleCard key={m.id === target ? `${m.id}-open` : m.id} m={m} n={`${level + 1}.${i + 1}`} done={done.has(m.id)} onDone={() => completeModule(m.id)} initiallyOpen={m.id === target} />)}</div>
        <div className="mt-8 flex justify-between">{level > 0 ? <Button variant="ghost" onClick={() => setLevel(level - 1)}>← {curriculum[level - 1]?.name}</Button> : <span />}{level < curriculum.length - 1 && <Button onClick={() => { setLevel(level + 1); window.scrollTo({ top: 0 }); }}>Next: {curriculum[level + 1]?.name} →</Button>}</div>
      </section>
      <div className="mt-12 border-t pt-6">
        <PktivoPronunciation className="text-xs" />
        <p className="mt-2 text-xs text-muted-foreground">Pktivo is not affiliated with Cisco. CCNA is a trademark of Cisco Systems. Always check the official exam topics before booking your exam.</p>
      </div>
    </main>
  </div>;
}
