import { Link } from '@tanstack/react-router';
import { Radar, Radio } from 'lucide-react';

/** Switches between the Wireshark and Nmap beginner guides. */
export function GuideSwitch({ current }: { current: 'wireshark' | 'nmap' }) {
  const base = 'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
  const on = 'bg-primary text-primary-foreground';
  const off = 'text-muted-foreground hover:text-foreground';
  return <nav aria-label="Choose a guide" className="inline-flex rounded-lg border bg-muted/40 p-1">
    <Link to="/how-to-read-wireshark-capture" className={`${base} ${current === 'wireshark' ? on : off}`} aria-current={current === 'wireshark' ? 'page' : undefined}><Radio className="size-4" />Wireshark guide</Link>
    <Link to="/how-to-run-nmap-scan" className={`${base} ${current === 'nmap' ? on : off}`} aria-current={current === 'nmap' ? 'page' : undefined}><Radar className="size-4" />Nmap guide</Link>
  </nav>;
}
