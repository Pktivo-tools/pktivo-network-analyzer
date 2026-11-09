import { describe, expect, it } from 'vitest';
import { THEMES, resolveTheme } from '@/lib/netlens/themes';

describe('Netpack theme choices', () => {
  it('keeps the mandatory basic light theme', () => {
    expect(resolveTheme('light')).toEqual({ id: 'light', name: 'Light', dark: false });
  });
  it('keeps the mandatory basic dark theme', () => {
    expect(resolveTheme('dark')).toEqual({ id: 'dark', name: 'Dark', dark: true });
  });
  it('provides ten additional unique themes', () => {
    expect(THEMES.filter(theme => theme.id !== 'light' && theme.id !== 'dark')).toHaveLength(10);
    expect(new Set(THEMES.map(theme => theme.id)).size).toBe(12);
  });
  it('includes purple-and-black and yellow-and-black presets', () => {
    expect(resolveTheme('amethyst').dark).toBe(true);
    expect(resolveTheme('amethyst').id).toBe('amethyst');
    expect(resolveTheme('volt').dark).toBe(true);
    expect(resolveTheme('volt').id).toBe('volt');
  });
  it('falls back safely for stale or missing saved choices', () => {
    expect(resolveTheme('unknown').id).toBe('light');
    expect(resolveTheme(null).id).toBe('light');
  });
});