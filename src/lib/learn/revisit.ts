// Browser-safe helpers for "lessons to revisit". Only course question data is used — never capture data.
export type Missed = { moduleId: string; question: string; chosen: string; correct: string };
export type Suggestion = { moduleId: string; title: string; level: string; reason: string };
export type ModuleRef = { id: string; title: string; level: string };

/** Keeps only lessons the learner actually missed, de-duplicated, max 3, in AI order. */
export function sanitizeSuggestions(raw: unknown, missed: Missed[], modules: ModuleRef[]): Suggestion[] {
  const allowed = new Set(missed.map(m => m.moduleId));
  const byId = new Map(modules.map(m => [m.id, m]));
  const list = (raw as { lessons?: unknown })?.lessons;
  if (!Array.isArray(list)) return [];
  const out: Suggestion[] = [];
  for (const item of list) {
    const id = typeof item?.moduleId === 'string' ? item.moduleId : '';
    const reason = typeof item?.reason === 'string' ? item.reason.trim().slice(0, 240) : '';
    const mod = byId.get(id);
    if (!mod || !allowed.has(id) || !reason || out.some(s => s.moduleId === id)) continue;
    out.push({ moduleId: id, title: mod.title, level: mod.level, reason });
    if (out.length === 3) break;
  }
  return out;
}
