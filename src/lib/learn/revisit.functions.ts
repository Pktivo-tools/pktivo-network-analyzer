import { createServerFn } from '@tanstack/react-start';
import { curriculum } from './curriculum';
import { sanitizeSuggestions, type Missed, type Suggestion } from './revisit';

const modules = curriculum.flatMap(l => l.modules.map(m => ({ id: m.id, title: m.title, level: l.name })));
const clip = (s: unknown) => (typeof s === 'string' ? s.slice(0, 400) : '');

export const suggestLessons = createServerFn({ method: 'POST' })
  .inputValidator((input: { missed: Missed[] }) => {
    const ids = new Set(modules.map(m => m.id));
    const missed = (Array.isArray(input?.missed) ? input.missed : []).slice(0, 30)
      .filter(m => ids.has(m?.moduleId))
      .map(m => ({ moduleId: m.moduleId, question: clip(m.question), chosen: clip(m.chosen), correct: clip(m.correct) }));
    if (missed.length === 0) throw new Error('No missed questions');
    return { missed };
  })
  .handler(async ({ data }): Promise<{ lessons: Suggestion[]; error?: string }> => {
    const { generateResponse, GatewayError } = await import('@lovable.dev/ai-gateway');
    const candidates = modules.filter(m => data.missed.some(x => x.moduleId === m.id));
    try {
      const res = await generateResponse({
        model: 'openai/gpt-6-astra',
        instructions: 'You are a friendly networking tutor for complete beginners. From the missed quiz questions, choose up to 3 lessons to reread, most important first. Only use moduleId values from the candidate list. For each, write one short plain-language sentence (max 25 words) explaining what the learner seems to confuse. No jargon without explanation.',
        input: [{ role: 'user', content: JSON.stringify({ candidates, missed: data.missed }) }],
        text: { format: { type: 'json_schema', name: 'lessons', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['lessons'],
          properties: { lessons: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['moduleId', 'reason'],
            properties: { moduleId: { type: 'string', enum: candidates.map(c => c.id) }, reason: { type: 'string' } } } } },
        } } },
      });
      const text = (res.output ?? []).flatMap((o: any) => (o.type === 'message' ? o.content ?? [] : []))
        .filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('');
      return { lessons: sanitizeSuggestions(JSON.parse(text), data.missed, modules) };
    } catch (e) {
      console.error('suggestLessons failed', e instanceof GatewayError ? { code: e.code, ids: e.ids } : e);
      return { lessons: [], error: 'Suggestions are unavailable right now.' };
    }
  });
