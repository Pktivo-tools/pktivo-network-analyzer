import { moreScripts } from './nse-library';
// Static, illustrative Nmap knowledge: scan types, packet sequences, options and NSE scripts.
export type Side = 'you' | 'target';
export interface Step { from: Side; label: string; note: string }
export interface ScanType { id: string; flag: string; name: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; needsRoot: boolean; summary: string; outcomes: { state: string; steps: Step[] }[] }

export const scanTypes: ScanType[] = [
  { id: 'syn', flag: '-sS', name: 'SYN scan ("half-open")', level: 'Beginner', needsRoot: true, summary: 'Default when run as administrator. Sends a SYN and never finishes the handshake, so it is fast and rarely logged by the application.', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'SYN', note: 'May I connect to this port?' }, { from: 'target', label: 'SYN/ACK', note: 'Yes, something is listening.' }, { from: 'you', label: 'RST', note: 'Nmap hangs up before a connection forms.' }] },
    { state: 'closed', steps: [{ from: 'you', label: 'SYN', note: 'May I connect?' }, { from: 'target', label: 'RST/ACK', note: 'Nothing listens here.' }] },
    { state: 'filtered', steps: [{ from: 'you', label: 'SYN', note: 'May I connect?' }, { from: 'target', label: '(no reply / ICMP unreachable)', note: 'A firewall dropped or rejected it.' }] } ] },
  { id: 'connect', flag: '-sT', name: 'TCP connect scan', level: 'Beginner', needsRoot: false, summary: 'Uses the operating system to open full connections. Works without admin rights but is slower and shows up in application logs.', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'SYN', note: 'May I connect?' }, { from: 'target', label: 'SYN/ACK', note: 'Yes.' }, { from: 'you', label: 'ACK', note: 'Connection completed — the service sees it.' }, { from: 'you', label: 'RST', note: 'Nmap closes it right away.' }] },
    { state: 'closed', steps: [{ from: 'you', label: 'SYN', note: 'May I connect?' }, { from: 'target', label: 'RST/ACK', note: 'Nothing listens here.' }] } ] },
  { id: 'udp', flag: '-sU', name: 'UDP scan', level: 'Intermediate', needsRoot: true, summary: 'Finds DNS, SNMP, DHCP and other UDP services. Slow, because silence can mean either open or filtered.', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'UDP probe', note: 'Protocol-specific payload, e.g. a DNS query.' }, { from: 'target', label: 'UDP reply', note: 'The service answered.' }] },
    { state: 'closed', steps: [{ from: 'you', label: 'UDP probe', note: '' }, { from: 'target', label: 'ICMP port unreachable', note: 'Type 3 code 3: nothing listens.' }] },
    { state: 'open|filtered', steps: [{ from: 'you', label: 'UDP probe', note: '' }, { from: 'target', label: '(silence)', note: 'Could be open, could be firewalled.' }] } ] },
  { id: 'ack', flag: '-sA', name: 'ACK scan', level: 'Advanced', needsRoot: true, summary: 'Maps firewall rules rather than open ports: tells you which ports are filtered vs unfiltered.', outcomes: [
    { state: 'unfiltered', steps: [{ from: 'you', label: 'ACK', note: 'An out-of-the-blue acknowledgement.' }, { from: 'target', label: 'RST', note: 'Reached the host: no stateful filter here.' }] },
    { state: 'filtered', steps: [{ from: 'you', label: 'ACK', note: '' }, { from: 'target', label: '(no reply)', note: 'A stateful firewall dropped it.' }] } ] },
  { id: 'fin', flag: '-sF', name: 'FIN / NULL / Xmas scans', level: 'Advanced', needsRoot: true, summary: 'Odd flag combinations that slip past some stateless filters. RFC 793 hosts reply RST when closed; Windows answers RST for everything.', outcomes: [
    { state: 'closed', steps: [{ from: 'you', label: 'FIN', note: 'Closing a connection that never existed.' }, { from: 'target', label: 'RST', note: 'Closed.' }] },
    { state: 'open|filtered', steps: [{ from: 'you', label: 'FIN', note: '' }, { from: 'target', label: '(silence)', note: 'Open ports ignore it — or a firewall did.' }] } ] },
  { id: 'ping', flag: '-sn', name: 'Host discovery only', level: 'Beginner', needsRoot: false, summary: 'Finds which devices are up without scanning ports. On a local network it uses ARP; elsewhere ICMP echo, TCP 443 SYN and TCP 80 ACK.', outcomes: [
    { state: 'up', steps: [{ from: 'you', label: 'ARP who-has / ICMP echo', note: 'Is anyone at this address?' }, { from: 'target', label: 'ARP reply / echo reply', note: 'Host is up.' }] } ] },
  { id: 'null', flag: '-sN', name: 'NULL scan', level: 'Advanced', needsRoot: true, summary: 'A TCP packet with no flags at all. Same logic as FIN: closed ports reply RST, open ports stay silent on RFC 793 systems.', outcomes: [
    { state: 'closed', steps: [{ from: 'you', label: '(no flags)', note: 'An empty TCP header.' }, { from: 'target', label: 'RST', note: 'Closed.' }] },
    { state: 'open|filtered', steps: [{ from: 'you', label: '(no flags)', note: '' }, { from: 'target', label: '(silence)', note: 'Open — or dropped by a firewall.' }] } ] },
  { id: 'xmas', flag: '-sX', name: 'Xmas scan', level: 'Advanced', needsRoot: true, summary: 'Sets FIN, PSH and URG — "lit up like a Christmas tree". Same reading as FIN and NULL; easy for an IDS to spot.', outcomes: [
    { state: 'closed', steps: [{ from: 'you', label: 'FIN/PSH/URG', note: 'Nonsense flag combination.' }, { from: 'target', label: 'RST', note: 'Closed.' }] },
    { state: 'open|filtered', steps: [{ from: 'you', label: 'FIN/PSH/URG', note: '' }, { from: 'target', label: '(silence)', note: 'Open or filtered.' }] } ] },
  { id: 'window', flag: '-sW', name: 'Window scan', level: 'Advanced', needsRoot: true, summary: 'Like ACK, but reads the TCP window size in the RST. On some systems a non-zero window means open.', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'ACK', note: '' }, { from: 'target', label: 'RST (window > 0)', note: 'Some stacks reveal open ports this way.' }] },
    { state: 'closed', steps: [{ from: 'you', label: 'ACK', note: '' }, { from: 'target', label: 'RST (window 0)', note: 'Closed.' }] },
    { state: 'filtered', steps: [{ from: 'you', label: 'ACK', note: '' }, { from: 'target', label: '(no reply)', note: 'Firewalled.' }] } ] },
  { id: 'maimon', flag: '-sM', name: 'Maimon scan', level: 'Advanced', needsRoot: true, summary: 'FIN/ACK probe. Historically some BSD systems dropped it for open ports. Mostly of learning interest today.', outcomes: [
    { state: 'closed', steps: [{ from: 'you', label: 'FIN/ACK', note: '' }, { from: 'target', label: 'RST', note: 'Closed (most systems answer RST for every port).' }] },
    { state: 'open|filtered', steps: [{ from: 'you', label: 'FIN/ACK', note: '' }, { from: 'target', label: '(silence)', note: 'Open on old BSD stacks, or filtered.' }] } ] },
  { id: 'idle', flag: '-sI zombie', name: 'Idle (zombie) scan', level: 'Advanced', needsRoot: true, summary: 'Blind scan through a third "zombie" host with predictable IP IDs. Your address never touches the target. Needs a suitable idle host and -Pn.', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'SYN/ACK → zombie', note: 'Read the zombie’s IP ID (say 100).' }, { from: 'you', label: 'SYN to target (spoofed as zombie)', note: 'Target answers the zombie.' }, { from: 'target', label: 'SYN/ACK → zombie', note: 'Zombie replies RST, IP ID becomes 101.' }, { from: 'you', label: 'SYN/ACK → zombie', note: 'IP ID is 102: it went up by 2 → port open.' }] },
    { state: 'closed|filtered', steps: [{ from: 'you', label: 'SYN to target (spoofed)', note: '' }, { from: 'target', label: 'RST → zombie / nothing', note: 'Zombie sends nothing back.' }, { from: 'you', label: 'Check zombie IP ID', note: 'Went up by only 1 → closed or filtered.' }] } ] },
  { id: 'sctp', flag: '-sY', name: 'SCTP INIT scan', level: 'Advanced', needsRoot: true, summary: 'The SYN scan of SCTP, used by telecom (SS7/SIGTRAN, 4G/5G cores).', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'INIT', note: '' }, { from: 'target', label: 'INIT-ACK', note: 'Listening.' }, { from: 'you', label: 'ABORT', note: 'Nmap tears it down.' }] },
    { state: 'closed', steps: [{ from: 'you', label: 'INIT', note: '' }, { from: 'target', label: 'ABORT', note: 'Closed.' }] } ] },
  { id: 'proto', flag: '-sO', name: 'IP protocol scan', level: 'Advanced', needsRoot: true, summary: 'Finds which IP protocols (TCP, UDP, ICMP, GRE, ESP…) a host supports instead of which ports.', outcomes: [
    { state: 'open', steps: [{ from: 'you', label: 'IP packet, protocol N', note: '' }, { from: 'target', label: 'Any reply in that protocol', note: 'Supported.' }] },
    { state: 'closed', steps: [{ from: 'you', label: 'IP packet, protocol N', note: '' }, { from: 'target', label: 'ICMP protocol unreachable', note: 'Not supported.' }] } ] },
  { id: 'list', flag: '-sL', name: 'List scan', level: 'Beginner', needsRoot: false, summary: 'Sends nothing to targets — just lists them (with reverse DNS names). Use it to double-check a range before scanning.', outcomes: [
    { state: 'listed', steps: [{ from: 'you', label: 'Reverse DNS lookup (to your resolver)', note: 'No packets to the targets themselves.' }] } ] },
];

export interface ScanOption { flag: string; group: 'Ports' | 'Detection' | 'Timing' | 'Output' | 'Discovery'; label: string; help: string; value?: string }
export const scanOptions: ScanOption[] = [
  { flag: '-F', group: 'Ports', label: 'Fast: top 100 ports', help: 'Good first look.' },
  { flag: '-p-', group: 'Ports', label: 'All 65,535 TCP ports', help: 'Thorough but slow.' },
  { flag: '--top-ports 1000', group: 'Ports', label: 'Top 1000 ports', help: 'Nmap\'s default list.' },
  { flag: '-sV', group: 'Detection', label: 'Service versions', help: 'Asks each open port what software runs there.' },
  { flag: '-O', group: 'Detection', label: 'Operating system guess', help: 'Fingerprints TCP/IP behaviour. Needs admin rights.' },
  { flag: '-sC', group: 'Detection', label: 'Default safe scripts', help: 'Runs the "default" NSE category.' },
  { flag: '-A', group: 'Detection', label: 'Aggressive (-sV -O -sC --traceroute)', help: 'Everything at once — noisy.' },
  { flag: '-Pn', group: 'Discovery', label: 'Skip ping, assume up', help: 'For hosts that block ping.' },
  { flag: '-n', group: 'Discovery', label: 'No DNS lookups', help: 'Faster and quieter.' },
  { flag: '-T2', group: 'Timing', label: 'Polite timing', help: 'Gentle on fragile networks.' },
  { flag: '-T4', group: 'Timing', label: 'Aggressive timing', help: 'Fast on reliable networks.' },
  { flag: '--reason', group: 'Output', label: 'Show why each state was chosen', help: 'Adds syn-ack, reset, no-response…' },
  { flag: '-oX scan.xml', group: 'Output', label: 'Save XML for this page', help: 'Required to open the result here.' },
];

export function buildCommand(scanFlag: string, flags: string[], target: string): string {
  const t = target.trim().replace(/[^A-Za-z0-9.:/,\- ]/g, '') || '192.168.1.0/24';
  return ['nmap', scanFlag, ...flags, t].filter(Boolean).join(' ');
}

export type NseCategory = 'safe' | 'default' | 'discovery' | 'version' | 'vuln' | 'auth' | 'brute' | 'intrusive' | 'broadcast' | 'exploit' | 'dos' | 'external' | 'fuzzer' | 'malware';
export const nseCategories: NseCategory[] = ['default', 'safe', 'discovery', 'version', 'vuln', 'auth', 'broadcast', 'external', 'brute', 'intrusive', 'exploit', 'dos', 'fuzzer', 'malware'];
export const riskyCategories: NseCategory[] = ['brute', 'intrusive', 'exploit', 'dos', 'fuzzer'];
export interface NseScript { id: string; services: string[]; categories: NseCategory[]; what: string; cve?: string }
export const nseScripts: NseScript[] = [
  { id: 'http-title', services: ['http', 'https'], categories: ['default', 'safe', 'discovery'], what: 'Shows the web page title.' },
  { id: 'http-headers', services: ['http', 'https'], categories: ['safe', 'discovery'], what: 'Lists HTTP response headers.' },
  { id: 'http-enum', services: ['http', 'https'], categories: ['discovery', 'intrusive'], what: 'Probes for common admin pages and apps.' },
  { id: 'http-vuln-cve2017-5638', services: ['http'], categories: ['vuln', 'intrusive'], what: 'Checks Apache Struts remote code execution.', cve: 'CVE-2017-5638' },
  { id: 'ssl-cert', services: ['https', 'ssl', 'imaps', 'smtps'], categories: ['default', 'safe', 'discovery'], what: 'Shows certificate subject, issuer and expiry.' },
  { id: 'ssl-enum-ciphers', services: ['https', 'ssl'], categories: ['safe', 'discovery'], what: 'Grades supported TLS versions and ciphers.' },
  { id: 'ssl-heartbleed', services: ['https', 'ssl'], categories: ['vuln', 'safe'], what: 'Detects the Heartbleed memory leak.', cve: 'CVE-2014-0160' },
  { id: 'ssh-hostkey', services: ['ssh'], categories: ['default', 'safe', 'discovery'], what: 'Shows the server\'s SSH key fingerprints.' },
  { id: 'ssh2-enum-algos', services: ['ssh'], categories: ['safe', 'discovery'], what: 'Lists key exchange and cipher algorithms.' },
  { id: 'ssh-brute', services: ['ssh'], categories: ['brute', 'intrusive'], what: 'Password guessing. Only with written permission.' },
  { id: 'smb-os-discovery', services: ['microsoft-ds', 'netbios-ssn'], categories: ['default', 'safe', 'discovery'], what: 'Reads OS, computer and domain name over SMB.' },
  { id: 'smb-vuln-ms17-010', services: ['microsoft-ds'], categories: ['vuln', 'safe'], what: 'Detects the EternalBlue vulnerability.', cve: 'CVE-2017-0143' },
  { id: 'smb-security-mode', services: ['microsoft-ds'], categories: ['default', 'safe'], what: 'Shows whether SMB signing is required.' },
  { id: 'ftp-anon', services: ['ftp'], categories: ['default', 'safe', 'auth'], what: 'Checks if anonymous FTP login works.' },
  { id: 'ftp-vsftpd-backdoor', services: ['ftp'], categories: ['vuln', 'intrusive'], what: 'Tests the vsftpd 2.3.4 backdoor.', cve: 'CVE-2011-2523' },
  { id: 'dns-recursion', services: ['domain'], categories: ['default', 'safe'], what: 'Checks if the DNS server answers anyone (open resolver).' },
  { id: 'smtp-commands', services: ['smtp'], categories: ['default', 'safe', 'discovery'], what: 'Lists commands the mail server supports.' },
  { id: 'rdp-ntlm-info', services: ['ms-wbt-server'], categories: ['default', 'safe', 'discovery'], what: 'Reads Windows host and domain names from RDP.' },
  { id: 'mysql-info', services: ['mysql'], categories: ['default', 'safe', 'discovery'], what: 'Shows MySQL version and capabilities.' },
  { id: 'snmp-info', services: ['snmp'], categories: ['default', 'safe'], what: 'Reads basic SNMP system information.' },
  { id: 'vulners', services: ['*'], categories: ['vuln', 'safe'], what: 'Matches detected versions against a CVE database (needs -sV and internet on the scanning machine).' },
];
nseScripts.push(...moreScripts);
export const safeCategories: NseCategory[] = ['safe', 'default', 'discovery', 'version'];
export function scriptsFor(services: string[], allowIntrusive: boolean): NseScript[] {
  const s = new Set(services);
  return nseScripts.filter(n => (n.services.includes('*') || n.services.some(x => s.has(x))) && (allowIntrusive || !n.categories.some(c => riskyCategories.includes(c))));
}
export function scriptCommand(scripts: string[], ports: number[], target: string): string {
  return buildCommand('-sV', [ports.length ? `-p ${ports.join(',')}` : '', scripts.length ? `--script ${scripts.join(',')}` : ''].filter(Boolean), target);
}
