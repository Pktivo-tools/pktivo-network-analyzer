import { Volume2 } from 'lucide-react';

/** Subtle "how to say the name" note for footers. */
export function PktivoPronunciation({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-muted-foreground ${className}`}
      title="How to say the name out loud"
    >
      <Volume2 className="size-3 shrink-0 opacity-70" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground/80">Pktivo</span>
        <span className="hidden sm:inline"> is pronounced </span>
        <span className="sm:hidden"> · </span>
        <span className="font-medium">“packet-ee-vo”</span>
      </span>
    </span>
  );
}
