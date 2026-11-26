import { describe, expect, it } from 'vitest';
import { shuffleChoices } from '@/lib/learn/shuffle';

describe('shuffleChoices', () => {
  const q = { q: 'x', choices: ['A', 'B', 'C'], answer: 1 };
  it('keeps the correct answer text after shuffling', () => {
    for (let n = 0; n < 50; n++) { const s = shuffleChoices(q); expect(s.choices[s.answer]).toBe('B'); expect([...s.choices].sort()).toEqual(['A', 'B', 'C']); }
  });
  it('places the correct answer in every position over many runs', () => {
    const seen = new Set<number>(); for (let n = 0; n < 300; n++) seen.add(shuffleChoices(q).answer);
    expect(seen).toEqual(new Set([0, 1, 2]));
  });
});
