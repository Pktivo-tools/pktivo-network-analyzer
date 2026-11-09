import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { resolveTheme, THEMES, type ThemeId } from '@/lib/netlens/themes';

export function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>('light');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let stored: unknown = 'light';
    try { stored = localStorage.getItem('netlens-theme'); } catch { /* Storage may be unavailable. */ }
    const saved = resolveTheme(stored);
    setTheme(saved.id);
    document.documentElement.dataset.theme = saved.id;
    document.documentElement.classList.toggle('dark', saved.dark);
  }, []);
  function select(id: ThemeId) {
    const selected = resolveTheme(id);
    setTheme(id);
    document.documentElement.dataset.theme = id;
    document.documentElement.classList.toggle('dark', selected.dark);
    try { localStorage.setItem('netlens-theme', id); } catch { /* Theme still works without storage. */ }
    setOpen(false);
  }
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Choose theme" title={`Theme: ${resolveTheme(theme).name}`}><Palette /></Button></PopoverTrigger>
    <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-4" aria-label="Theme choices">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Appearance</h2><span className="text-xs text-muted-foreground">12 themes</span></div>
      <div className="grid grid-cols-2 gap-2">{THEMES.map(option => <Button key={option.id} variant="outline" aria-pressed={theme === option.id} onClick={() => select(option.id)} className={`h-auto flex-col items-stretch gap-2 p-2 ${theme === option.id ? 'border-primary ring-1 ring-primary' : ''}`}>
        <span data-theme={option.id} className={`theme-swatch ${option.dark ? 'dark' : ''}`} aria-hidden="true"><span className="swatch-rail"/><span className="swatch-content"><span className="swatch-line"/><span className="swatch-line short"/><span className="swatch-accent"/></span></span>
        <span className="flex items-center justify-between gap-1 text-xs font-medium">{option.name}{theme === option.id && <Check className="size-3 text-primary"/>}</span>
      </Button>)}</div>
    </PopoverContent>
  </Popover>;
}