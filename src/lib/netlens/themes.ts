export const THEMES = [
  { id: 'light', name: 'Light', dark: false },
  { id: 'dark', name: 'Dark', dark: true },
  { id: 'amethyst', name: 'Amethyst', dark: true },
  { id: 'volt', name: 'Volt', dark: true },
  { id: 'cyan', name: 'Cyber Cyan', dark: true },
  { id: 'rose', name: 'Black Rose', dark: true },
  { id: 'emerald', name: 'Emerald', dark: true },
  { id: 'ember', name: 'Ember', dark: true },
  { id: 'cobalt', name: 'Cobalt', dark: true },
  { id: 'silver', name: 'Graphite', dark: true },
  { id: 'lavender', name: 'Lavender', dark: false },
  { id: 'ocean', name: 'Ocean Mist', dark: false },
] as const;
export type ThemeId = typeof THEMES[number]['id'];
export function resolveTheme(value: unknown) {
  return THEMES.find(theme => theme.id === value) ?? THEMES[0];
}