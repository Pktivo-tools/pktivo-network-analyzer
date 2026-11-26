import { openPorts, type NmapScan } from './nmap-xml';

export interface ServiceRow { key: string; port: number; protocol: string; service: string; hosts: string[]; versions: string[] }

/** Groups open ports across all hosts by port/protocol. Most widespread first. */
export function serviceInventory(scan: NmapScan): ServiceRow[] {
  const m = new Map<string, ServiceRow>();
  for (const h of scan.hosts) for (const p of openPorts(h)) {
    const key = `${p.port}/${p.protocol}`;
    const row = m.get(key) ?? { key, port: p.port, protocol: p.protocol, service: p.service, hosts: [], versions: [] };
    row.hosts.push(h.address);
    const v = [p.product, p.version].filter(Boolean).join(' ');
    if (v && !row.versions.includes(v)) row.versions.push(v);
    if (!row.service && p.service) row.service = p.service;
    m.set(key, row);
  }
  return [...m.values()].sort((a, b) => b.hosts.length - a.hosts.length || a.port - b.port);
}

const csvCell = (v: string | number) => { const s = String(v); const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };

/** One row per scanned port (hosts without ports get one empty row). Guards against spreadsheet formula injection. */
export function scanToCsv(scan: NmapScan): string {
  const rows: (string | number)[][] = [['host', 'hostname', 'status', 'port', 'protocol', 'state', 'service', 'version', 'os']];
  for (const h of scan.hosts) {
    if (!h.ports.length) rows.push([h.address, h.hostname, h.status, '', '', '', '', '', h.os]);
    for (const p of h.ports) rows.push([h.address, h.hostname, h.status, p.port, p.protocol, p.state, p.service, [p.product, p.version].filter(Boolean).join(' '), h.os]);
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n';
}

/** Addresses of hosts that are up, one per line — ready for `nmap -iL`. */
export function liveHostList(scan: NmapScan, onlyWithOpenPorts = false): string {
  return scan.hosts.filter(h => h.status === 'up' && (!onlyWithOpenPorts || openPorts(h).length)).map(h => h.address).join('\n') + '\n';
}

export interface NextStep { title: string; why: string; command: string }

/** Suggested follow-up scans based on what the loaded scan did and found. */
export function nextSteps(scan: NmapScan): NextStep[] {
  const a = ` ${scan.args} `;
  const has = (f: string) => a.includes(` ${f} `) || a.includes(` ${f}`);
  const withOpen = scan.hosts.filter(h => openPorts(h).length);
  const targets = withOpen.slice(0, 5).map(h => h.address).join(' ') || '<target>';
  const all = new Set(withOpen.flatMap(h => openPorts(h).map(p => p.service)));
  const out: NextStep[] = [];
  if (!withOpen.length && scan.hosts.some(h => h.status === 'up')) out.push({ title: 'Look for open ports', why: 'Devices answered, but no open ports were found or scanned.', command: 'nmap -iL live-hosts.txt -oX ports.xml' });
  if (withOpen.length && !has('-sV') && !has('-A')) out.push({ title: 'Identify services and versions', why: 'Ports are open but versions are unknown.', command: `nmap -sV -oX versions.xml ${targets}` });
  if (withOpen.length && !has('-O') && !has('-A')) out.push({ title: 'Guess operating systems', why: 'No OS detection was run. Needs administrator rights.', command: `sudo nmap -O -oX os.xml ${targets}` });
  if (withOpen.length && !has('-p-')) out.push({ title: 'Check all 65,535 TCP ports', why: 'Only common ports were scanned; services can hide on unusual ports.', command: `nmap -p- -T4 -oX allports.xml ${targets}` });
  if (!has('-sU')) out.push({ title: 'Check common UDP services', why: 'TCP scans miss DNS, DHCP, SNMP and other UDP services.', command: `sudo nmap -sU --top-ports 20 -oX udp.xml ${targets}` });
  if (all.has('http') || all.has('https') || all.has('http-proxy')) out.push({ title: 'Look closer at web servers', why: 'Web services were found.', command: `nmap -p 80,443,8080,8443 --script http-title,http-headers,ssl-cert -oX web.xml ${targets}` });
  if (all.has('microsoft-ds') || all.has('netbios-ssn')) out.push({ title: 'Check Windows file sharing safety', why: 'SMB is open; check signing and the protocol version.', command: `nmap -p 445 --script smb-protocols,smb2-security-mode -oX smb.xml ${targets}` });
  if (all.has('ssh')) out.push({ title: 'Review SSH settings', why: 'SSH is open; see which login methods and ciphers it offers.', command: `nmap -p 22 --script ssh2-enum-algos,ssh-auth-methods -oX ssh.xml ${targets}` });
  return out;
}

export interface Recipe { id: string; goal: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; flags: string; explain: string; root?: boolean }
export const recipes: Recipe[] = [
  { id: 'find', goal: 'Find devices on my network', level: 'Beginner', flags: '-sn', explain: 'Ping sweep only — lists devices that are up, no ports. Gentle and quick.' },
  { id: 'quick', goal: 'Quick check of common ports', level: 'Beginner', flags: '-F', explain: 'The 100 most common TCP ports. Good first look at one device.' },
  { id: 'services', goal: 'What is running and which version', level: 'Beginner', flags: '-sV', explain: '1,000 common ports plus service and version detection.' },
  { id: 'web', goal: 'Find web servers', level: 'Beginner', flags: '-p 80,443,8080,8443 --script http-title', explain: 'Only web ports, and shows each page title.' },
  { id: 'full', goal: 'Every TCP port, faster timing', level: 'Intermediate', flags: '-p- -T4', explain: 'All 65,535 ports. Slower, finds services on unusual ports.' },
  { id: 'udp', goal: 'Common UDP services', level: 'Intermediate', flags: '-sU --top-ports 20', explain: 'DNS, DHCP, SNMP and friends. UDP is slow; keep the port list short.', root: true },
  { id: 'os', goal: 'Guess operating systems', level: 'Intermediate', flags: '-O --osscan-guess', explain: 'Fingerprints the TCP/IP stack to guess the OS.', root: true },
  { id: 'aggr', goal: 'Detailed audit of one device', level: 'Advanced', flags: '-sS -sV -O -sC -p- -T4', explain: 'SYN scan, versions, OS, default scripts, all ports. Noisy — use on your own lab.', root: true },
  { id: 'vuln', goal: 'Check for known vulnerabilities', level: 'Advanced', flags: '-sV --script vuln', explain: 'Runs vuln-category scripts. Some can be intrusive; only with permission.' },
  { id: 'fw', goal: 'Map firewall rules', level: 'Advanced', flags: '-sA -p 1-1024', explain: 'ACK scan shows which ports are filtered versus reachable.', root: true },
];

/** Builds a recipe command with a sanitised target and XML output so it opens in Scan Map. */
export function recipeCommand(r: Recipe, target: string, file = 'scan.xml'): string {
  const t = target.trim().replace(/[^A-Za-z0-9.:/,\- ]/g, '') || '192.168.1.0/24';
  return `${r.root ? 'sudo ' : ''}nmap ${r.flags} -oX ${file} ${t}`;
}

export interface PortInfo { port: number; protocol: 'tcp' | 'udp'; service: string; what: string }
export const commonPorts: PortInfo[] = [
  { port: 20, protocol: 'tcp', service: 'ftp-data', what: 'FTP file transfer data channel.' },
  { port: 21, protocol: 'tcp', service: 'ftp', what: 'File transfer. Sends passwords unencrypted.' },
  { port: 22, protocol: 'tcp', service: 'ssh', what: 'Secure remote login and file copy.' },
  { port: 23, protocol: 'tcp', service: 'telnet', what: 'Old remote login with no encryption. Avoid.' },
  { port: 25, protocol: 'tcp', service: 'smtp', what: 'Sending email between servers.' },
  { port: 53, protocol: 'udp', service: 'domain', what: 'DNS name lookups (also TCP for large replies).' },
  { port: 67, protocol: 'udp', service: 'dhcps', what: 'DHCP server — hands out IP addresses.' },
  { port: 69, protocol: 'udp', service: 'tftp', what: 'Trivial file transfer, no login. Used for network boot.' },
  { port: 80, protocol: 'tcp', service: 'http', what: 'Websites without encryption.' },
  { port: 110, protocol: 'tcp', service: 'pop3', what: 'Downloading email (old).' },
  { port: 123, protocol: 'udp', service: 'ntp', what: 'Clock synchronisation.' },
  { port: 135, protocol: 'tcp', service: 'msrpc', what: 'Windows remote procedure calls.' },
  { port: 137, protocol: 'udp', service: 'netbios-ns', what: 'Windows name lookups on the local network.' },
  { port: 139, protocol: 'tcp', service: 'netbios-ssn', what: 'Old Windows file sharing.' },
  { port: 143, protocol: 'tcp', service: 'imap', what: 'Reading email on a server.' },
  { port: 161, protocol: 'udp', service: 'snmp', what: 'Device monitoring. Default community strings are a common weakness.' },
  { port: 389, protocol: 'tcp', service: 'ldap', what: 'Directory lookups (users, groups).' },
  { port: 443, protocol: 'tcp', service: 'https', what: 'Encrypted websites and APIs.' },
  { port: 445, protocol: 'tcp', service: 'microsoft-ds', what: 'Windows file sharing (SMB). Should not face the internet.' },
  { port: 465, protocol: 'tcp', service: 'smtps', what: 'Email submission over TLS.' },
  { port: 514, protocol: 'udp', service: 'syslog', what: 'Log messages from devices.' },
  { port: 587, protocol: 'tcp', service: 'submission', what: 'Email submission from mail apps.' },
  { port: 631, protocol: 'tcp', service: 'ipp', what: 'Printing.' },
  { port: 993, protocol: 'tcp', service: 'imaps', what: 'IMAP over TLS.' },
  { port: 1433, protocol: 'tcp', service: 'ms-sql-s', what: 'Microsoft SQL Server database.' },
  { port: 1883, protocol: 'tcp', service: 'mqtt', what: 'IoT messaging, often unencrypted.' },
  { port: 1900, protocol: 'udp', service: 'upnp', what: 'Device discovery (SSDP/UPnP) on home networks.' },
  { port: 3306, protocol: 'tcp', service: 'mysql', what: 'MySQL/MariaDB database.' },
  { port: 3389, protocol: 'tcp', service: 'ms-wbt-server', what: 'Windows Remote Desktop. Often attacked if exposed.' },
  { port: 5353, protocol: 'udp', service: 'mdns', what: 'Local name discovery (Bonjour, .local names).' },
  { port: 5432, protocol: 'tcp', service: 'postgresql', what: 'PostgreSQL database.' },
  { port: 5900, protocol: 'tcp', service: 'vnc', what: 'Remote screen sharing.' },
  { port: 6379, protocol: 'tcp', service: 'redis', what: 'Redis in-memory database; often has no password by default.' },
  { port: 8080, protocol: 'tcp', service: 'http-proxy', what: 'Alternative web port, admin panels, proxies.' },
  { port: 8443, protocol: 'tcp', service: 'https-alt', what: 'Alternative HTTPS port, often admin panels.' },
  { port: 9100, protocol: 'tcp', service: 'jetdirect', what: 'Raw network printing.' },
  { port: 27017, protocol: 'tcp', service: 'mongodb', what: 'MongoDB database.' },
];

/** Finds ports by number, service name or description. */
export function lookupPorts(q: string): PortInfo[] {
  const s = q.trim().toLowerCase();
  if (!s) return commonPorts;
  return commonPorts.filter(p => String(p.port) === s || p.service.includes(s) || p.what.toLowerCase().includes(s));
}
