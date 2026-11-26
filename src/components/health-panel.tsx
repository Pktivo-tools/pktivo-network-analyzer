import { CheckCircle2, ChevronRight, Lock, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { msText, type HealthReport } from '@/lib/netlens/health';

/** Plain-language capture verdict plus per-step timings and what to check. */
export function HealthPanel({ report, onInspect }: { report: HealthReport; onInspect: (nos: number[], title: string) => void }) {
  const worst = Math.max(1, ...report.phases.map((p) => p.worstMs ?? 0));
  const tone =
    report.verdict === 'healthy'
      ? 'border-primary/40 bg-primary/5'
      : report.verdict === 'watch'
        ? 'border-border bg-muted/40'
        : 'border-destructive/40 bg-destructive/5';
  return (
    <div className="border-t" data-private-capture>
      <section className="px-6 py-5">
        <div className={`rounded-md border p-4 ${tone}`}>
          <p className="flex items-center gap-2 text-sm font-medium">
            {report.verdict === 'healthy' ? (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            ) : (
              <TriangleAlert className={`size-4 shrink-0 ${report.verdict === 'troubled' ? 'text-destructive' : 'text-muted-foreground'}`} />
            )}
            {report.headline}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {report.connections} conversations · {report.answered} set up fully · {report.affected} packets behind the items below
          </p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3 shrink-0" />Worked out on this device from the capture only — no lookups are sent anywhere.
          </p>
        </div>
      </section>
      <div className="pane-heading">
        <span>HOW LONG EACH STEP TOOK</span>
        <span className="font-mono text-muted-foreground">typical / slowest</span>
      </div>
      <div className="px-6 py-4">
        {report.phases.map((p) => (
          <div key={p.id} className="mb-5 last:mb-0">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{p.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {p.samples ? `${msText(p.medianMs)} / ${msText(p.worstMs)}` : 'not visible in this capture'}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${p.status === 'slow' ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${p.worstMs === null ? 0 : Math.max(2, Math.min(100, ((p.worstMs ?? 0) / worst) * 100))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.plain}
              {p.detail ? ` · ${p.detail}` : ''}
              {p.samples ? ` · ${p.samples} measured` : ''}
            </p>
            {p.status === 'slow' && (
              <p className="mt-1 text-xs text-destructive">The slowest one took more than {msText(p.slowMs)} — worth a look.</p>
            )}
            {p.packetNos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2"
                onClick={() => onInspect(p.packetNos, `${p.label} timing`)}
              >
                Show the two packets <ChevronRight className="size-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="pane-heading">
        <span>WHAT TO CHECK</span>
        <span className="font-mono text-muted-foreground">{report.problems.length} items</span>
      </div>
      {report.problems.length ? (
        report.problems.map((p) => (
          <div key={p.id} className="border-b px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${p.level === 'review' ? 'border-destructive/40 text-destructive' : 'border-border text-muted-foreground'}`}
              >
                {p.level === 'review' ? 'check first' : 'worth a look'}
              </span>
              <span className="text-sm font-medium">{p.title}</span>
              <span className="text-xs text-muted-foreground">{p.packetNos.length} packets</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.explanation}</p>
            <p className="mt-1 text-sm">{p.next}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => onInspect(p.packetNos, p.title)}>
              Show these packets
            </Button>
          </div>
        ))
      ) : (
        <p className="px-6 py-5 text-sm text-muted-foreground">
          Nothing to check — no data had to be sent again, no pauses, and every connection that asked got an answer.
        </p>
      )}
    </div>
  );
}
