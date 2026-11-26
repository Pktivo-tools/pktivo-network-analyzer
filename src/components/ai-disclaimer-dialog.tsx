import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { dismissDisclaimer, shouldShowDisclaimer } from '@/lib/ai-disclaimer';

export function AiDisclaimerDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Storage is only readable after hydration, and the modal must not hide the page
  // until React has finished hydrating it, so the notice opens on a short delay.
  useEffect(() => {
    let show = true;
    try {
      show = shouldShowDisclaimer(window.localStorage);
    } catch {
      show = true;
    }
    if (!show) return;
    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    if (dontShowAgain) {
      try {
        dismissDisclaimer(window.localStorage);
      } catch {
        // Storage blocked: the notice simply comes back on the next visit.
      }
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) close(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="size-5" /></span>
          <DialogTitle className="pt-2">Pktivo is built entirely by AI</DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            Every part of this project — the packet reader, the warning rules, the lessons and this
            interface — was designed and written by artificial intelligence.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            <strong className="font-medium text-foreground">Don&apos;t trust the results completely.</strong>{' '}
            Findings, filters and explanations can be wrong, incomplete or out of date. Never rely on
            Pktivo alone to decide whether a network is safe, to fix a live outage, or to prepare for an
            exam — check important answers somewhere else too.
          </p>
          <p>
            <strong className="font-medium text-foreground">Only scan networks you own or have permission to test.</strong>{' '}
            Recording traffic with Wireshark or scanning with Nmap on networks that aren&apos;t yours, without
            permission, can break rules, contracts or laws.
          </p>
          <p>
            <strong className="font-medium text-foreground">It keeps improving.</strong> The project is
            updated regularly, so what is missing or rough today should work better soon.
          </p>
        </div>
        <div className="flex items-start gap-2.5 border-t pt-4">
          <Checkbox id="ai-disclaimer-hide" checked={dontShowAgain} onCheckedChange={value => setDontShowAgain(value === true)} />
          <Label htmlFor="ai-disclaimer-hide" className="text-sm font-normal leading-6 text-muted-foreground">
            Don&apos;t show this notice again on this device
          </Label>
        </div>
        <DialogFooter>
          <Button onClick={close}>I understand — continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
