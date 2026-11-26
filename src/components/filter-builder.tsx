import { useMemo, useState } from 'react';
import { ArrowRight, BookmarkPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FILTER_EXAMPLES, compileFilter } from '@/lib/netlens/filter';
import {
  allGroups,
  buildFilter,
  emptySelection,
  selectionForFilter,
  type BuilderContext,
  type BuilderGroup,
  type BuilderSelection,
} from '@/lib/netlens/filter-builder';

export interface SavedFilter {
  name: string;
  filter: string;
}

/** Chip-based filter picker with an editable result, a saved list and starting points. */
export function FilterBuilder({
  context,
  applied,
  saved,
  onSave,
  onDelete,
  onApply,
}: {
  context: BuilderContext | null;
  applied: string;
  saved: SavedFilter[];
  onSave: (name: string, filter: string) => void;
  onDelete: (name: string) => void;
  onApply: (filter: string) => void;
}) {
  const groups = useMemo(() => allGroups(context), [context]);
  const [selection, setSelection] = useState<BuilderSelection>(() => selectionForFilter(applied, context));
  const [override, setOverride] = useState<string | null>(null);
  const [name, setName] = useState('');
  const generated = useMemo(() => buildFilter(selection, context), [selection, context]);
  const text = override ?? generated;
  const check = useMemo(() => compileFilter(text), [text]);

  function toggle(group: BuilderGroup, id: string) {
    setOverride(null);
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      const has = current.includes(id);
      const next = group.multi
        ? has
          ? current.filter((x) => x !== id)
          : [...current, id]
        : has
          ? []
          : [id];
      const copy = { ...prev };
      if (next.length) copy[group.id] = next;
      else delete copy[group.id];
      return copy;
    });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.id}>
          <h3 className="text-sm font-medium">{group.label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{group.hint}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.choices.map((choice) => {
              const on = (selection[group.id] ?? []).includes(choice.id);
              return (
                <Button
                  key={choice.id}
                  variant={on ? 'secondary' : 'outline'}
                  size="sm"
                  aria-pressed={on}
                  title={choice.filter}
                  onClick={() => toggle(group, choice.id)}
                >
                  {choice.label}
                </Button>
              );
            })}
          </div>
        </section>
      ))}
      <section className="border-t pt-4">
        <h3 className="text-sm font-medium">Result</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Click the chips, then edit this if you want. Anything you type is used exactly as written.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            aria-label="Built filter"
            value={text}
            onChange={(e) => setOverride(e.target.value)}
            placeholder="Pick at least one chip"
            className="min-w-0 flex-1 rounded-md border bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <Button size="sm" disabled={!check.ok} onClick={() => onApply(text.trim())}>
            <ArrowRight />
            <span className="hidden sm:inline">Apply</span>
          </Button>
        </div>
        {!check.ok && <p role="alert" className="mt-1 text-xs text-destructive">{check.error}</p>}
        {text.trim() && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              aria-label="Name for this filter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this filter"
              className="min-w-0 flex-1 rounded-md border bg-transparent px-3 py-1.5 text-xs outline-none focus:border-primary"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!name.trim() || !check.ok}
              onClick={() => {
                onSave(name.trim(), text.trim());
                setName('');
              }}
            >
              <BookmarkPlus />
              Save
            </Button>
          </div>
        )}
      </section>
      <section className="border-t pt-4">
        <h3 className="text-sm font-medium">Saved in this tab</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Kept only while this tab is open, so nothing you name here is stored on your device or sent anywhere.
        </p>
        {saved.length ? (
          <div className="mt-2 space-y-1">
            {saved.map((s) => (
              <div key={s.name} className="flex items-center gap-2 border-b py-2">
                <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => onApply(s.filter)}>
                  {s.name}
                </Button>
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">{s.filter}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => onDelete(s.name)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Nothing saved yet.</p>
        )}
      </section>
      <section className="border-t pt-4">
        <h3 className="text-sm font-medium">Starting points</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FILTER_EXAMPLES.map((e) => (
            <Button key={e.filter} variant="outline" size="sm" title={e.filter} onClick={() => onApply(e.filter)}>
              {e.label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
