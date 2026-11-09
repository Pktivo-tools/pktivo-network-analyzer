import { describe, expect, it } from 'vitest';
import { curriculum } from '@/lib/learn/curriculum';
import { course, questionsFor } from '@/lib/learn/course';

describe('reading course and test', () => {
  const modules = curriculum.flatMap(l => l.modules);
  it('every module has reading lessons and three test questions', () => {
    for (const m of modules) {
      expect(course[m.id]?.lessons.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(questionsFor(m.id, m.quiz)).toHaveLength(3);
    }
  });
  it('every question has a valid answer index', () => {
    for (const m of modules) for (const q of questionsFor(m.id, m.quiz)) expect(q.choices[q.answer]).toBeDefined();
  });
});
