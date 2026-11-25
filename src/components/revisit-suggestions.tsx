import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { suggestLessons, type RevisitCourse } from '@/lib/learn/revisit.functions';
import type { Missed, Suggestion } from '@/lib/learn/revisit';

/** AI-picked lessons to reread. Only quiz questions are sent — never capture data. */
export function RevisitSuggestions({ course, missed, onOpen }: { course: RevisitCourse; missed: Missed[]; onOpen: (moduleId: string) => void }) {
  const ask = useServerFn(suggestLessons);
  const [state, setState] = useState<{ lessons?: Suggestion[]; error?: string }>({});
  useEffect(() => {
    let live = true;
    ask({ data: { course, missed } })
      .then(r => { if (live) setState(r.lessons.length ? { lessons: r.lessons } : { error: r.error ?? 'No suggestions this time.' }); })
      .catch(() => { if (live) setState({ error: 'Suggestions are unavailable right now.' }); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <section className="mt-6 overflow-hidden rounded-xl border border-primary/30 bg-card" aria-live="polite" aria-labelledby={`revisit-${course}`}>
    <div className="flex items-center gap-3 border-b bg-accent/50 px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Sparkles className="size-4" /></span>
      <div className="min-w-0"><h2 id={`revisit-${course}`} className="text-sm font-semibold">Lessons to revisit</h2><p className="text-xs text-muted-foreground">Picked from the questions you missed</p></div>
    </div>
    <div className="p-4">
      {!state.lessons && !state.error && <div className="space-y-2" aria-label="Loading suggestions">{[0, 1].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>}
      {state.error && <p className="text-sm text-muted-foreground">{state.error} Use the review below instead.</p>}
      {state.lessons && <ol className="space-y-2">{state.lessons.map((l, i) => <li key={l.moduleId}>
        <button type="button" onClick={() => onOpen(l.moduleId)} className="group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-accent">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs text-muted-foreground group-hover:border-primary group-hover:text-primary">{i + 1}</span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{l.title} <span className="font-normal text-muted-foreground">· {l.level}</span></span><span className="mt-0.5 block text-sm leading-6 text-muted-foreground">{l.reason}</span></span>
          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        </button></li>)}</ol>}
      <p className="mt-3 text-xs text-muted-foreground">Suggested by AI. Only the quiz questions are sent, nothing else. It can be wrong.</p>
    </div>
  </section>;
}
