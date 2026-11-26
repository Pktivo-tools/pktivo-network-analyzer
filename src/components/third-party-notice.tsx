type Tool = 'wireshark' | 'nmap';
const TEXT: Record<Tool, string> = {
  wireshark: 'Wireshark is a separate program by the Wireshark Foundation',
  nmap: 'Nmap is a separate program by the Nmap Project',
};

/** States that Wireshark/Nmap are independent third-party tools, not part of Pktivo. */
export function ThirdPartyNotice({ tools, className = '' }: { tools: Tool[]; className?: string }) {
  const parts = tools.map((t) => TEXT[t]);
  const names = tools.map((t) => (t === 'wireshark' ? 'Wireshark' : 'Nmap')).join(' or ');
  return <p className={`text-xs text-muted-foreground ${className}`}>
    {parts.join('; ')}. {tools.length > 1 ? 'They are' : 'It is'} not part of Pktivo, and Pktivo is not affiliated with or endorsed by {tools.length > 1 ? 'either project' : 'it'}. Pktivo only reads files you save with {names}. Trademarks belong to their owners.
  </p>;
}
