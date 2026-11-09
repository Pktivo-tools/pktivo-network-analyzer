import { describe, expect, it } from 'vitest';
import { DISMISSAL_KEY, dismissDisclaimer, shouldShowDisclaimer } from '@/lib/ai-disclaimer';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}

describe('AI-built notice', () => {
  it('shows on entry when nothing has been stored yet', () => {
    expect(shouldShowDisclaimer(memoryStorage())).toBe(true);
  });

  it('stays hidden on a later visit once the visitor asks not to see it again', () => {
    const storage = memoryStorage();
    expect(dismissDisclaimer(storage)).toBe(true);
    expect([...storage.data.keys()]).toEqual([DISMISSAL_KEY]);
    expect(shouldShowDisclaimer(storage)).toBe(false);
    expect(shouldShowDisclaimer(memoryStorage({ [DISMISSAL_KEY]: '1' }))).toBe(false);
  });

  it('shows again for stored values that are not a real dismissal', () => {
    expect(shouldShowDisclaimer(memoryStorage({ [DISMISSAL_KEY]: '' }))).toBe(true);
    expect(shouldShowDisclaimer(memoryStorage({ [DISMISSAL_KEY]: '0' }))).toBe(true);
  });

  it('keeps showing the notice when device storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('Blocked'); }, setItem: () => { throw new Error('Blocked'); } };
    expect(shouldShowDisclaimer(blocked)).toBe(true);
    expect(dismissDisclaimer(blocked)).toBe(false);
  });
});
