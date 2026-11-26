import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  const panelRef = useRef<HTMLDivElement>(null);

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

  function showSettings() {
    setChoice(readChoice('analytics'));
    setSettings(true);
    setOpen(true);
  }

  function save(choiceToSave: Choice) {
    saveChoices({ analytics: choiceToSave });
    setChoice(readChoice('analytics'));
    setOpen(false);
    setSettings(false);
  }

  if (!open) {
    return <Button type="button" variant="outline" size="sm" onClick={showSettings} className="fixed bottom-3 right-3 z-30 bg-background/95 text-xs shadow-md">Cookie settings</Button>;
  }

  return <div ref={panelRef} tabIndex={-1} role="region" aria-label="Your privacy choices" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border bg-background/95 p-5 text-foreground shadow-2xl outline-none backdrop-blur sm:p-6">
    {settings ? <>
      <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="font-semibold">Cookie settings</h2></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose whether Pktivo can measure clicks. Your packet captures are never part of this choice and never leave this tab.</p>
      <div className="mt-5 divide-y rounded-md border">
        <div className="flex items-start justify-between gap-4 p-4">
          <div><p className="text-sm font-medium">Necessary</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Always on. Delivers the site and remembers preferences you choose to save.</p></div>
          <span className="text-xs font-medium text-muted-foreground">Always on</span>
        </div>
        <div className="flex items-start justify-between gap-4 p-4">
          <div><label htmlFor="analytics-consent" className="text-sm font-medium">Analytics, provided by Lovable</label><p className="mt-1 text-xs leading-5 text-muted-foreground">Measures clicks only when allowed. Visit counting identifies no one.</p></div>
          <Switch id="analytics-consent" aria-label="Analytics, provided by Lovable" checked={!privacySignal && choice === 'granted'} disabled={privacySignal} onCheckedChange={checked => setChoice(checked ? 'granted' : 'denied')} />
        </div>
      </div>
      {privacySignal && <p className="mt-3 text-xs leading-5 text-muted-foreground">Your browser’s privacy signal applies, so analytics stays off.</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); setSettings(false); }}>Not now</Button>
        <Button type="button" onClick={() => save(choice ?? 'denied')}>Save choices</Button>
      </div>
    </> : <>
      <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h2 className="font-semibold">Your privacy, your choice</h2></div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">We count visits without identifying you. If you accept, we also measure clicks. Your captures stay in this browser tab either way. Read our <Link to="/privacy" className="text-primary underline underline-offset-4">privacy policy</Link>.</p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Button type="button" variant="outline" onClick={() => save('granted')}>Accept all</Button>
        <Button type="button" variant="outline" onClick={() => save('denied')}>Reject all</Button>
        <Button type="button" variant="ghost" className="col-span-2 sm:col-span-1" onClick={showSettings}>Cookie settings</Button>
      </div>
    </>}
  </div>;
}
