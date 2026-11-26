import { TriangleAlert } from 'lucide-react';
type Tool = 'wireshark' | 'nmap';
const TEXT: Record<Tool, string> = {
  wireshark: 'Wireshark is a separate program by the Wireshark Foundation',
  nmap: 'Nmap is a separate program by the Nmap Project',
};

/** States that Wireshark/Nmap are independent third-party tools, not part of Pktivo. */
export function ThirdPartyNotice({ tools, className = '' }: { tools: Tool[]; className?: string }) {
  const parts = tools.map((t) => TEXT[t]);
  const names = tools.map((t) => (t === 'wireshark' ? 'Wireshark' : 'Nmap')).join(' or ');
  return <div className={`space-y-2 text-xs text-muted-foreground ${className}`}>
    <p role="note" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 font-medium text-foreground"><TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />Only scan or record networks you own or have permission to test. Capturing or scanning other people’s networks can break rules or laws.</p>
    <p>
    {parts.join('; ')}. {tools.length > 1 ? 'They are' : 'It is'} not part of Pktivo, and Pktivo is not affiliated with or endorsed by {tools.length > 1 ? 'either project' : 'it'}. Pktivo only reads files you save with {names}. Trademarks belong to their owners.
  </p></div>;
}
