import { useMemo, useState } from 'react';
import { ArrowDownToLine, Bookmark, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchPackets } from '@/lib/netlens/search';
import type { Packet } from '@/lib/netlens/types';

/** Search every decoded value, keep marked packets with notes, and export them. */
export function NotesPanel({
  packets,
  notes,
  onNote,
  onInspect,
  onSelect,
  onExport,
}: {
  packets: Packet[];
  notes: Map<number, string>;
  onNote: (no: number, text: string) => void;
  onInspect: (nos: number[], title: string) => void;
  onSelect: (no: number) => void;
  onExport: (kind: 'csv' | 'json' | 'marked') => void;
}) {
  const [query, setQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const result = useMemo(() => searchPackets(packets, query, { regex: useRegex }), [packets, query, useRegex]);
  const marked = useMemo(() => packets.filter((p) => notes.has(p.no)), [packets, notes]);

  return (
    <div className="border-t" data-private-capture>
      <div className="pane-heading">
        <span>SEARCH EVERY DECODED VALUE</span>
        <span className="font-mono text-muted-foreground">
          {query.trim() ? `${result.matched.size} packets` : `${packets.length} packets`}
        </span>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search packet values"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a word, an address, a name…"
            className="min-w-0 flex-1 rounded-md border bg-transparent px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <Button variant={useRegex ? 'secondary' : 'outline'} size="sm" title="Treat the search as a regular expression" onClick={() => setUseRegex(!useRegex)}>
            .*
          </Button>
          {query && (
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Clear search" onClick={() => setQuery('')}>
              <X />
            </Button>
          )}
        </div>
        {result.error && <p role="alert" className="mt-2 text-xs text-destructive">{result.error}</p>}
        {query.trim() && !result.error && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!result.matched.size}
              onClick={() => onInspect([...result.matched], `Search: ${query.trim()}`)}
            >
              Show only these {result.matched.size} packets
            </Button>
            {result.truncated && <span className="text-xs text-muted-foreground">First 400 matches shown — narrow the search for the rest.</span>}
          </div>
        )}
        {result.hits.length ? (
          <div className="mt-3 max-h-64 overflow-auto border">
            {result.hits.slice(0, 80).map((h, i) => (
              <button
                key={`${h.no}-${h.field}-${i}`}
                type="button"
                onClick={() => onSelect(h.no)}
                className="flex w-full items-baseline gap-2 border-b px-3 py-1.5 text-left text-xs hover:bg-muted"
              >
                <span className="shrink-0 font-mono text-muted-foreground">#{h.no}</span>
                <span className="shrink-0 font-mono text-primary">{h.field}</span>
                <span className="min-w-0 flex-1 truncate font-mono">{h.value}</span>
              </button>
            ))}
          </div>
        ) : query.trim() && !result.error ? (
          <p className="mt-3 text-xs text-muted-foreground">Nothing in this capture contains that.</p>
        ) : null}
      </div>
      <div className="pane-heading">
        <span>MARKED PACKETS &amp; NOTES</span>
        <span className="font-mono text-muted-foreground">{marked.length} marked</span>
      </div>
      <div className="px-6 py-4">
        {marked.length ? (
          <div className="space-y-3">
            {marked.map((p) => (
              <div key={p.no} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Bookmark className="size-3 shrink-0 text-primary" />
                  <button type="button" className="font-mono text-primary" onClick={() => onSelect(p.no)}>
                    Packet #{p.no}
                  </button>
                  <span className="text-muted-foreground">
                    {p.src} → {p.dst} · {p.protocol} · {p.len} bytes
                  </span>
                  <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={() => onNote(p.no, '')}>
                    Unmark
                  </Button>
                </div>
                <textarea
                  aria-label={`Note for packet ${p.no}`}
                  value={notes.get(p.no) ?? ''}
                  onChange={(e) => onNote(p.no, e.target.value)}
                  rows={2}
                  placeholder="Why did you mark this packet?"
                  className="mt-2 w-full rounded-md border bg-transparent p-2 text-xs outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No marked packets yet. Open a packet in the packet list and press “Mark this packet” to keep it here with a note.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled={!marked.length} onClick={() => onExport('csv')}>
            <ArrowDownToLine />
            Notes as CSV
          </Button>
          <Button variant="outline" size="sm" disabled={!marked.length} onClick={() => onExport('json')}>
            <ArrowDownToLine />
            Notes as JSON
          </Button>
          <Button variant="outline" size="sm" disabled={!marked.length} onClick={() => onExport('marked')}>
            <ArrowDownToLine />
            Marked packets as .pcapng
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Marks, notes and search results live in this tab only. Closing the tab removes them, and nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
