import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronDown, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';
import { SubnetCalculator, SubnetPractice } from '@/components/subnetting-trainer';
import { subnetLessons } from '@/lib/learn/subnetting';
import { readLearnProgress, saveLearnProgress } from '@/lib/learn/progress';

export const Route = createFileRoute('/learn_/subnetting')({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: 'Subnetting course and practice — Pktivo CCNA Learn' },
    { name: 'description', content: 'Learn IPv4 subnetting for the CCNA exam with beginner-friendly readings, a visual subnet calculator and progressive practice questions on masks, ranges and LAN sizing.' },
    { property: 'og:title', content: 'Subnetting course and practice — Pktivo CCNA Learn' },
    { property: 'og:description', content: 'Free subnetting lessons from binary and CIDR to VLSM, with explained practice answers and saved reading progress.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SubnettingPage,
});

function SubnettingPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saveFailed, setSaveFailed] = useState(false);
  const [tab, setTab] = useState<'reading' | 'calculator' | 'practice'>('reading');
  useEffect(() => { try { setDone(readLearnProgress(window.localStorage)); } catch { setSaveFailed(true); } }, []);
  function complete(id: string) {
    const next = new Set(done).add(id); setDone(next);
    try { setSaveFailed(!saveLearnProgress(window.localStorage, next)); } catch { setSaveFailed(true); }
  }
  const count = subnetLessons.filter(l => done.has(l.id)).length;
  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-8"><Link to="/" className="flex items-center gap-2 font-semibold"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link><Button asChild variant="ghost" size="sm"><Link to="/learn"><ArrowLeft />Back to CCNA Learn</Link></Button></header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-2 text-sm text-primary"><Network className="size-4" />CCNA Learn · Focus course</div>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Subnetting, one bit at a time</h1>
      <Button asChild variant="link" size="sm" className="mt-2 px-0"><Link to="/glossary"><BookOpen />Networking glossary →</Link></Button>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">From reading an IPv4 address to planning networks with VLSM. Build the reasoning behind the answer, not just a memorized formula.</p>
      <div className="mt-6"><div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{saveFailed ? 'Progress not saved' : 'Reading progress · saved on this device'}</span><span>{count} / {subnetLessons.length} lessons read</span></div><progress className="mt-2 h-1.5 w-full" value={count} max={subnetLessons.length} />{saveFailed && <p role="status" className="mt-2 text-xs text-destructive">Your browser couldn’t save progress. It will last only for this visit.</p>}</div>
      <div className="mt-8 flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Subnetting course sections">{([{ id: 'reading', name: 'Reading course' }, { id: 'calculator', name: 'Visual calculator' }, { id: 'practice', name: 'Practice' }] as const).map(t => <Button key={t.id} role="tab" aria-selected={tab === t.id} aria-controls={`subnet-${t.id}`} id={`tab-${t.id}`} variant={tab === t.id ? 'secondary' : 'ghost'} onClick={() => setTab(t.id)}>{t.name}</Button>)}</div>
      <div id="subnet-reading" role="tabpanel" aria-labelledby="tab-reading" hidden={tab !== 'reading'}>
        <h2 className="mt-8 flex items-center gap-2 text-xl font-semibold"><BookOpen className="size-5 text-primary" />The subnetting course</h2>
        <div className="mt-5 space-y-3">{subnetLessons.map((lesson, i) => <details key={lesson.id} className="group rounded-lg border bg-card" open={i === 0 ? true : undefined}>
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${done.has(lesson.id) ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{done.has(lesson.id) ? <Check className="size-4" /> : i + 1}</span><span className="min-w-0 flex-1"><span className="block font-medium">{lesson.title}</span><span className="text-xs text-muted-foreground">{lesson.level}{done.has(lesson.id) ? ' · Read' : ''}</span></span><ChevronDown className="size-4 shrink-0 group-open:rotate-180" /></summary>
          <div className="border-t p-4 sm:p-6"><p className="border-l-2 border-primary bg-accent p-3 text-sm leading-6">{lesson.simple}</p>{lesson.readings.map(r => <section key={r.heading} className="mt-5"><h3 className="font-medium">{r.heading}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{r.body}</p></section>)}<div className="mt-5 border-y py-4"><h3 className="text-xs font-medium text-muted-foreground">Worked example</h3><p className="mt-2 break-words font-mono text-sm leading-6">{lesson.example}</p></div><p className="mt-4 text-sm"><strong>Remember: </strong>{lesson.takeaway}</p><div className="mt-5 flex justify-end"><Button size="sm" variant={done.has(lesson.id) ? 'secondary' : 'default'} disabled={done.has(lesson.id)} onClick={() => complete(lesson.id)}><Check />{done.has(lesson.id) ? 'Read' : 'Mark as read'}</Button></div></div>
        </details>)}</div>
        <div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => setTab('practice')}>Practice subnetting →</Button><Button variant="outline" onClick={() => setTab('calculator')}>Explore an address</Button></div>
      </div>
      <div id="subnet-calculator" role="tabpanel" aria-labelledby="tab-calculator" hidden={tab !== 'calculator'}><SubnetCalculator /></div>
      <div id="subnet-practice" role="tabpanel" aria-labelledby="tab-practice" hidden={tab !== 'practice'}><SubnetPractice /></div>
      <div className="mt-12 border-t pt-6"><div className="flex flex-wrap gap-3"><Button asChild variant="outline" size="sm"><Link to="/learn">Full networking course</Link></Button><Button asChild variant="ghost" size="sm"><Link to="/learn/test">CCNA practice test →</Link></Button></div><PktivoPronunciation className="mt-6 text-xs" /><p className="mt-2 text-xs text-muted-foreground">Independent study material, not affiliated with Cisco. CCNA is a Cisco trademark; this course does not guarantee exam readiness.</p></div>
    </main>
  </div>;
}