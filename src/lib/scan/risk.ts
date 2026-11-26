import type { ScanPort } from './nmap-xml';
// Beginner hints per port. Clues, not verdicts.
const notes: Record<number, { level: 'watch' | 'info'; text: string }> = {
  21: { level: 'watch', text: 'FTP sends passwords in plain text.' },
  23: { level: 'watch', text: 'Telnet sends everything, including passwords, unencrypted. Usually should be off.' },
  22: { level: 'info', text: 'SSH remote login. Fine if keys or strong passwords are used.' },
  53: { level: 'info', text: 'DNS. Normal on routers and domain controllers.' },
  80: { level: 'info', text: 'Unencrypted web page. Check whether it redirects to HTTPS.' },
  139: { level: 'watch', text: 'Old NetBIOS file sharing. Rarely needed today.' },
  445: { level: 'watch', text: 'Windows/SMB file sharing. Never expose it to the internet.' },
  3306: { level: 'watch', text: 'Database port. Usually should only be reachable from the app server.' },
  3389: { level: 'watch', text: 'Remote Desktop. A common attack target when exposed.' },
  5900: { level: 'watch', text: 'VNC screen sharing. Often weakly protected.' },
  8080: { level: 'info', text: 'Alternate web port, often an admin panel or proxy.' },
  443: { level: 'info', text: 'Encrypted web (HTTPS).' },
};
export const portNote = (p: ScanPort) => notes[p.port];
