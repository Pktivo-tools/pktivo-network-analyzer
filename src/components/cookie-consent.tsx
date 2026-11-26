import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GitHubLink } from '@/components/github-link';
import { needsAnswer, onConsentChange, readChoice, saveChoices, type Choice } from '@/lib/consent';

const PURPOSES = ['analytics'] as const;

function browserPrivacySignal(): boolean {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [privacySignal, setPrivacySignal] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    setPrivacySignal(browserPrivacySignal());
    setChoice(readChoice('analytics'));
    void needsAnswer([...PURPOSES]).then(needed => {
      if (active && needed) {
        setSettings(false);
        setOpen(true);
      }
    });
    const unsubscribe = onConsentChange(() => {
      if (active) setChoice(readChoice('analytics'));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open, settings]);

  useEffect(() => {
    if (!saved) return;
    settingsButtonRef.current?.focus({ preventScroll: true });
    const timeout = window.setTimeout(() => setSaved(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  function showSettings() {
    setSaved(false);
    setChoice(readChoice('analytics'));
    setSettings(true);
    setOpen(true);
  }

  function save(choiceToSave: Choice) {
    saveChoices({ analytics: choiceToSave });
    setChoice(readChoice('analytics'));
    setOpen(false);
    setSettings(false);
    setSaved(true);
  }

  if (!open) {
    return <div className="flex items-center justify-between gap-2 border-t bg-background px-3 py-2">
      <GitHubLink className="-ml-2" />
      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-14 right-3 z-50 max-w-[calc(100%-1.5rem)]">
        {saved && <p className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-foreground shadow-md"><Check aria-hidden="true" className="size-4 shrink-0 text-primary" />Preferences saved: necessary always on; analytics {choice === 'granted' ? 'on' : 'off'}.</p>}
      </div>
      <Button ref={settingsButtonRef} type="button" variant="ghost" size="sm" onClick={showSettings} className="text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" className="size-3.5" />Cookie settings</Button>
    </div>;
  }

  return <div ref={panelRef} tabIndex={-1} role="region" aria-label="Your privacy choices" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border bg-background/95 p-5 text-foreground shadow-2xl outline-none backdrop-blur sm:p-6">
    <Button type="button" variant="ghost" size="icon" aria-label="Close cookie banner" title="Close cookie banner" className="absolute right-2 top-2 size-8 text-muted-foreground" onClick={() => { setOpen(false); setSettings(false); }}><X aria-hidden="true" className="size-4" /></Button>
    {settings ? <>
      <div className="flex items-center gap-2 pr-6"><ShieldCheck className="size-5 shrink-0 text-primary" /><h2 className="font-semibold">Cookie settings</h2></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose whether Pktivo can measure clicks. Your packet captures are never part of this choice and never leave this tab.</p>
      <div className="mt-5 divide-y rounded-md border">
        <div className="flex items-start justify-between gap-4 p-4">
          <div><p className="text-sm font-medium">Necessary</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Always on. Delivers the site and remembers preferences you choose to save.</p></div>
          <span className="text-xs font-medium text-muted-foreground">Always on</span>
        </div>
        <label htmlFor="analytics-consent" className={`flex min-h-11 items-center justify-between gap-4 p-4 ${privacySignal ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <span><span className="block text-sm font-medium">Analytics, provided by Lovable</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Measures clicks only when allowed. Visit counting identifies no one.</span></span>
          <Switch type="button" id="analytics-consent" aria-label="Analytics, provided by Lovable" className="h-7 w-12 [&>span]:size-6 [&>span[data-state=checked]]:translate-x-5" checked={!privacySignal && choice === 'granted'} disabled={privacySignal} onCheckedChange={checked => setChoice(checked ? 'granted' : 'denied')} />
        </label>
      </div>
      {privacySignal && <p className="mt-3 text-xs leading-5 text-muted-foreground">Your browser’s privacy signal applies, so analytics stays off.</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={privacySignal} onClick={() => save('granted')}>Accept all</Button>
        <Button type="button" onClick={() => save(choice ?? 'denied')}>Save choices</Button>
      </div>
    </> : <>
      <div className="flex items-center gap-2 pr-6"><ShieldCheck className="size-5 shrink-0 text-primary" /><h2 className="font-semibold">Your privacy, your choice</h2></div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">We count visits without identifying you. If you accept, we also measure clicks. Your captures stay in this browser tab either way. Read our <Link to="/privacy" className="text-primary underline underline-offset-4">privacy policy</Link>.</p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Button type="button" variant="outline" onClick={() => save('granted')}>Accept all</Button>
        <Button type="button" variant="outline" onClick={() => save('denied')}>Reject all</Button>
        <Button type="button" variant="ghost" className="col-span-2 sm:col-span-1" onClick={showSettings}>Cookie settings</Button>
      </div>
    </>}
  </div>;
}
