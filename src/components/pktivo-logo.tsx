/** Pktivo logo: a packet "cube" whose corners are network nodes. */
export function PktivoLogo({className}:{className?:string}) {
  return <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <path d="M16 4 26.4 10v12L16 28 5.6 22V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M5.6 10 16 16l10.4-6M16 16v12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity=".55"/>
    <circle cx="16" cy="16" r="3" fill="currentColor"/>
  </svg>;
}
