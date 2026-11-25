import { describe, expect, it } from 'vitest';
import { findGlossaryTerms, glossaryTerms } from '@/lib/learn/glossary';

describe('glossary term discovery', () => {
  it('finds matching terms regardless of capitalization or outside whitespace', () => {
    const names = findGlossaryTerms('  vLsM  ').map(t => t.name);
    expect(names).toContain('VLSM');
    expect(names).not.toContain('Wireshark');
  });
  it('combines category filtering with search', () => {
    expect(findGlossaryTerms('TCP', 'Protocols').some(t => t.name === 'TCP')).toBe(true);
    expect(findGlossaryTerms('TCP', 'Addressing').some(t => t.name === 'TCP')).toBe(false);
    expect(findGlossaryTerms('', 'Security').every(t => t.category === 'Security')).toBe(true);
  });
  it('returns an empty result for an unknown term and all terms for an empty search', () => {
    expect(findGlossaryTerms('not-a-networking-term-123')).toHaveLength(0);
    expect(findGlossaryTerms('')).toHaveLength(glossaryTerms.length);
  });
});