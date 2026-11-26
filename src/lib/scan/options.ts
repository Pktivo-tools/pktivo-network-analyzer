// Full Nmap command-line option reference (from `nmap --help` / the Nmap Reference Guide), grouped for the Scan simulator and Script playbook.
export type OptionGroup = 'Target' | 'Host discovery' | 'Scan technique' | 'Ports' | 'Service / version' | 'OS detection' | 'Scripts' | 'Timing' | 'Firewall / evasion' | 'Output' | 'Misc';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export interface NmapOption { flag: string; group: OptionGroup; label: string; help: string; level: Level; value?: string; root?: boolean; noisy?: boolean; exclusive?: string }

export const optionGroups: OptionGroup[] = ['Target', 'Host discovery', 'Scan technique', 'Ports', 'Service / version', 'OS detection', 'Scripts', 'Timing', 'Firewall / evasion', 'Output', 'Misc'];

export const nmapOptions: NmapOption[] = [
  // Target
  { flag: '-iL', group: 'Target', value: 'targets.txt', label: 'Read targets from a file', help: 'One host, range or network per line. Pairs with Scan Map’s Host list export.', level: 'Beginner' },
  { flag: '-iR', group: 'Target', value: '10', label: 'Random targets', help: 'Picks random internet hosts. Do not use without permission — it scans strangers.', level: 'Advanced' },
  { flag: '--exclude', group: 'Target', value: '192.168.1.1', label: 'Skip these hosts', help: 'Comma-separated hosts or networks to leave out, e.g. your router.', level: 'Beginner' },
  { flag: '--excludefile', group: 'Target', value: 'skip.txt', label: 'Skip hosts listed in a file', help: 'Like --exclude, from a file.', level: 'Intermediate' },
  // Host discovery
  { flag: '-sL', group: 'Host discovery', label: 'List targets only', help: 'Prints the targets that would be scanned, sends no probes. Great for checking a range.', level: 'Beginner', exclusive: 'disc' },
  { flag: '-sn', group: 'Host discovery', label: 'Ping scan (no ports)', help: 'Finds devices that are up without scanning ports.', level: 'Beginner', exclusive: 'disc' },
  { flag: '-Pn', group: 'Host discovery', label: 'Skip discovery, treat all as up', help: 'For hosts that block ping. Slower: every address gets port probes.', level: 'Beginner', exclusive: 'disc' },
  { flag: '-PS', group: 'Host discovery', value: '22,80,443', label: 'TCP SYN ping', help: 'Discover hosts with SYN packets to these ports.', level: 'Intermediate' },
  { flag: '-PA', group: 'Host discovery', value: '80,443', label: 'TCP ACK ping', help: 'Discover hosts with ACK packets; can pass stateless filters.', level: 'Intermediate' },
  { flag: '-PU', group: 'Host discovery', value: '53,161', label: 'UDP ping', help: 'Discover hosts with UDP packets.', level: 'Intermediate', root: true },
  { flag: '-PY', group: 'Host discovery', value: '', label: 'SCTP INIT ping', help: 'Discovery for SCTP (telecom) networks.', level: 'Advanced', root: true },
  { flag: '-PE', group: 'Host discovery', label: 'ICMP echo ping', help: 'Classic “ping” request.', level: 'Intermediate', root: true },
  { flag: '-PP', group: 'Host discovery', label: 'ICMP timestamp ping', help: 'Alternative ICMP probe when echo is blocked.', level: 'Advanced', root: true },
  { flag: '-PM', group: 'Host discovery', label: 'ICMP netmask ping', help: 'Rarely answered today; mostly historical.', level: 'Advanced', root: true },
  { flag: '-PO', group: 'Host discovery', value: '1,2,4', label: 'IP protocol ping', help: 'Sends packets with these IP protocol numbers.', level: 'Advanced', root: true },
  { flag: '-PR', group: 'Host discovery', label: 'ARP ping', help: 'Default and most reliable on your local network.', level: 'Intermediate', root: true },
  { flag: '--disable-arp-ping', group: 'Host discovery', label: 'No ARP/ND ping', help: 'Use other probes even on the local network.', level: 'Advanced' },
  { flag: '--traceroute', group: 'Host discovery', label: 'Trace the route to each host', help: 'Shows the routers between you and the target.', level: 'Intermediate', root: true },
  { flag: '-n', group: 'Host discovery', label: 'Never resolve DNS names', help: 'Faster and quieter.', level: 'Beginner', exclusive: 'dns' },
  { flag: '-R', group: 'Host discovery', label: 'Always resolve DNS names', help: 'Look up names even for hosts that are down.', level: 'Intermediate', exclusive: 'dns' },
  { flag: '--dns-servers', group: 'Host discovery', value: '1.1.1.1', label: 'Use these DNS servers', help: 'Comma-separated resolvers for name lookups.', level: 'Advanced' },
  { flag: '--system-dns', group: 'Host discovery', label: 'Use the system resolver', help: 'Slower; uses your OS DNS settings.', level: 'Advanced' },
  // Scan techniques (the scan type itself is chosen separately; these are extras)
  { flag: '-sV', group: 'Service / version', label: 'Detect service versions', help: 'Asks each open port what software and version runs there.', level: 'Beginner' },
  { flag: '--version-intensity', group: 'Service / version', value: '7', label: 'Version probe intensity (0–9)', help: 'Higher = more probes, more accurate, slower.', level: 'Advanced' },
  { flag: '--version-light', group: 'Service / version', label: 'Light version detection', help: 'Intensity 2. Faster, less accurate.', level: 'Intermediate' },
  { flag: '--version-all', group: 'Service / version', label: 'Try every version probe', help: 'Intensity 9. Slow and thorough.', level: 'Advanced' },
  { flag: '--version-trace', group: 'Service / version', label: 'Debug version detection', help: 'Prints what each probe got back.', level: 'Advanced' },
  { flag: '-O', group: 'OS detection', label: 'Guess the operating system', help: 'Fingerprints TCP/IP behaviour. Best with at least one open and one closed port.', level: 'Beginner', root: true },
  { flag: '--osscan-limit', group: 'OS detection', label: 'Only promising hosts', help: 'Skip OS detection where results would be poor.', level: 'Advanced' },
  { flag: '--osscan-guess', group: 'OS detection', label: 'Guess more aggressively', help: 'Shows near matches when unsure.', level: 'Intermediate' },
  { flag: '-A', group: 'OS detection', label: 'Aggressive: -O -sV -sC --traceroute', help: 'Everything useful at once. Noisy.', level: 'Intermediate', root: true, noisy: true },
  // Ports
  { flag: '-F', group: 'Ports', label: 'Fast: top 100 ports', help: 'Good first look.', level: 'Beginner', exclusive: 'ports' },
  { flag: '-p', group: 'Ports', value: '22,80,443', label: 'These ports', help: 'List or ranges: 1-1024, U:53,T:80, or -p- for all.', level: 'Beginner', exclusive: 'ports' },
  { flag: '-p-', group: 'Ports', label: 'All 65,535 ports', help: 'Thorough but slow.', level: 'Intermediate', exclusive: 'ports' },
  { flag: '--top-ports', group: 'Ports', value: '1000', label: 'Most common N ports', help: '1000 is Nmap’s default.', level: 'Beginner', exclusive: 'ports' },
  { flag: '--exclude-ports', group: 'Ports', value: '9100', label: 'Skip these ports', help: 'E.g. printers that print garbage when probed (9100).', level: 'Intermediate' },
  { flag: '-r', group: 'Ports', label: 'Scan ports in order', help: 'Default is random order.', level: 'Advanced' },
  { flag: '--port-ratio', group: 'Ports', value: '0.1', label: 'Ports more common than ratio', help: 'Between 0 and 1.', level: 'Advanced' },
  // Scripts
  { flag: '-sC', group: 'Scripts', label: 'Default safe scripts', help: 'Same as --script=default.', level: 'Beginner' },
  { flag: '--script', group: 'Scripts', value: 'default,safe', label: 'Run scripts / categories', help: 'Names, categories, folders or expressions like "default and not intrusive".', level: 'Intermediate' },
  { flag: '--script-args', group: 'Scripts', value: 'http.useragent=Mozilla', label: 'Script arguments', help: 'key=value pairs passed to scripts.', level: 'Advanced' },
  { flag: '--script-args-file', group: 'Scripts', value: 'args.txt', label: 'Script arguments from a file', help: 'One key=value per line.', level: 'Advanced' },
  { flag: '--script-trace', group: 'Scripts', label: 'Show all script traffic', help: 'Prints data sent and received by scripts.', level: 'Advanced' },
  { flag: '--script-updatedb', group: 'Scripts', label: 'Rebuild the script database', help: 'After adding your own .nse files.', level: 'Advanced' },
  { flag: '--script-help', group: 'Scripts', value: 'http-title', label: 'Help for a script', help: 'Prints what a script or category does.', level: 'Beginner' },
  // Timing
  { flag: '-T0', group: 'Timing', label: 'Paranoid (T0)', help: 'Extremely slow, IDS evasion.', level: 'Advanced', exclusive: 'timing' },
  { flag: '-T1', group: 'Timing', label: 'Sneaky (T1)', help: 'Very slow.', level: 'Advanced', exclusive: 'timing' },
  { flag: '-T2', group: 'Timing', label: 'Polite (T2)', help: 'Gentle on fragile networks and devices.', level: 'Beginner', exclusive: 'timing' },
  { flag: '-T3', group: 'Timing', label: 'Normal (T3)', help: 'The default.', level: 'Beginner', exclusive: 'timing' },
  { flag: '-T4', group: 'Timing', label: 'Aggressive (T4)', help: 'Fast on reliable networks.', level: 'Beginner', exclusive: 'timing' },
  { flag: '-T5', group: 'Timing', label: 'Insane (T5)', help: 'Can miss ports and overload links.', level: 'Advanced', exclusive: 'timing', noisy: true },
  { flag: '--min-rate', group: 'Timing', value: '100', label: 'At least N packets/second', help: 'Keeps the scan moving.', level: 'Intermediate' },
  { flag: '--max-rate', group: 'Timing', value: '50', label: 'At most N packets/second', help: 'Be gentle on shared networks.', level: 'Intermediate' },
  { flag: '--max-retries', group: 'Timing', value: '2', label: 'Retries per port', help: 'Lower = faster, may miss ports.', level: 'Intermediate' },
  { flag: '--host-timeout', group: 'Timing', value: '5m', label: 'Give up on a host after', help: 'E.g. 30s, 5m.', level: 'Intermediate' },
  { flag: '--scan-delay', group: 'Timing', value: '100ms', label: 'Wait between probes', help: 'Slows down to avoid rate limits.', level: 'Advanced' },
  { flag: '--max-scan-delay', group: 'Timing', value: '1s', label: 'Max wait between probes', help: '', level: 'Advanced' },
  { flag: '--min-hostgroup', group: 'Timing', value: '64', label: 'Min hosts in parallel', help: '', level: 'Advanced' },
  { flag: '--max-hostgroup', group: 'Timing', value: '16', label: 'Max hosts in parallel', help: '', level: 'Advanced' },
  { flag: '--min-parallelism', group: 'Timing', value: '10', label: 'Min probes in parallel', help: '', level: 'Advanced' },
  { flag: '--max-parallelism', group: 'Timing', value: '1', label: 'Max probes in parallel', help: '1 = one probe at a time.', level: 'Advanced' },
  { flag: '--min-rtt-timeout', group: 'Timing', value: '100ms', label: 'Min round-trip timeout', help: '', level: 'Advanced' },
  { flag: '--max-rtt-timeout', group: 'Timing', value: '500ms', label: 'Max round-trip timeout', help: '', level: 'Advanced' },
  { flag: '--initial-rtt-timeout', group: 'Timing', value: '250ms', label: 'Starting round-trip timeout', help: '', level: 'Advanced' },
  // Evasion
  { flag: '-f', group: 'Firewall / evasion', label: 'Fragment packets', help: 'Splits probes into tiny IP fragments.', level: 'Advanced', root: true },
  { flag: '--mtu', group: 'Firewall / evasion', value: '16', label: 'Fragment size', help: 'Multiple of 8.', level: 'Advanced', root: true },
  { flag: '-D', group: 'Firewall / evasion', value: 'RND:5,ME', label: 'Decoys', help: 'Hide your scan among fake sources. Only on networks you are authorised to test.', level: 'Advanced', root: true, noisy: true },
  { flag: '-S', group: 'Firewall / evasion', value: '10.0.0.5', label: 'Spoof source address', help: 'Replies go elsewhere; usually needs -e and -Pn.', level: 'Advanced', root: true },
  { flag: '-e', group: 'Firewall / evasion', value: 'eth0', label: 'Use this network interface', help: 'Choose Wi-Fi, Ethernet or VPN.', level: 'Intermediate' },
  { flag: '-g', group: 'Firewall / evasion', value: '53', label: 'Source port', help: 'Some firewalls trust port 53 or 20.', level: 'Advanced', root: true },
  { flag: '--proxies', group: 'Firewall / evasion', value: 'socks4://127.0.0.1:9050', label: 'Through proxies', help: 'HTTP/SOCKS4 chain; connect scans only.', level: 'Advanced' },
  { flag: '--data-length', group: 'Firewall / evasion', value: '25', label: 'Add random payload bytes', help: 'Makes probes look less like Nmap defaults.', level: 'Advanced' },
  { flag: '--data', group: 'Firewall / evasion', value: 'deadbeef', label: 'Custom hex payload', help: '', level: 'Advanced' },
  { flag: '--data-string', group: 'Firewall / evasion', value: 'hello', label: 'Custom text payload', help: '', level: 'Advanced' },
  { flag: '--ip-options', group: 'Firewall / evasion', value: 'R', label: 'IP options', help: 'Record route, source routing…', level: 'Advanced', root: true },
  { flag: '--ttl', group: 'Firewall / evasion', value: '64', label: 'IP time-to-live', help: '', level: 'Advanced', root: true },
  { flag: '--spoof-mac', group: 'Firewall / evasion', value: '0', label: 'Spoof MAC address', help: '0 = random, or a vendor name / MAC.', level: 'Advanced', root: true },
  { flag: '--badsum', group: 'Firewall / evasion', label: 'Bogus checksums', help: 'Replies reveal a device that does not check checksums (firewall/IDS).', level: 'Advanced', root: true },
  { flag: '--randomize-hosts', group: 'Firewall / evasion', label: 'Shuffle host order', help: 'Spreads probes over the range.', level: 'Intermediate' },
  // Output
  { flag: '-oX', group: 'Output', value: 'scan.xml', label: 'Save XML (opens in Scan Map)', help: 'Required to view results on this page.', level: 'Beginner' },
  { flag: '-oN', group: 'Output', value: 'scan.txt', label: 'Save normal text', help: 'What you see on screen.', level: 'Beginner' },
  { flag: '-oG', group: 'Output', value: 'scan.gnmap', label: 'Save grepable output', help: 'One line per host; easy for grep/awk.', level: 'Intermediate' },
  { flag: '-oA', group: 'Output', value: 'scan', label: 'Save all three formats', help: 'scan.xml, scan.nmap and scan.gnmap.', level: 'Beginner' },
  { flag: '-v', group: 'Output', label: 'Verbose', help: 'Shows open ports as they are found. -vv for more.', level: 'Beginner' },
  { flag: '-d', group: 'Output', label: 'Debug output', help: 'A lot of detail. -dd for more.', level: 'Advanced' },
  { flag: '--reason', group: 'Output', label: 'Show why each state was chosen', help: 'syn-ack, reset, no-response…', level: 'Beginner' },
  { flag: '--open', group: 'Output', label: 'Only show open ports', help: 'Hides closed and filtered from the screen.', level: 'Beginner' },
  { flag: '--packet-trace', group: 'Output', label: 'Show every packet', help: 'Great for learning what a scan sends.', level: 'Intermediate' },
  { flag: '--stats-every', group: 'Output', value: '30s', label: 'Progress every', help: 'Prints progress at an interval.', level: 'Beginner' },
  { flag: '--append-output', group: 'Output', label: 'Append, don’t overwrite', help: '', level: 'Intermediate' },
  { flag: '--resume', group: 'Output', value: 'scan.gnmap', label: 'Resume an aborted scan', help: 'From normal or grepable output. Use on its own.', level: 'Advanced' },
  { flag: '--webxml', group: 'Output', label: 'Link Nmap’s online stylesheet', help: 'Makes XML viewable in a browser.', level: 'Advanced' },
  { flag: '--no-stylesheet', group: 'Output', label: 'No XSL stylesheet', help: '', level: 'Advanced' },
  // Misc
  { flag: '-6', group: 'Misc', label: 'IPv6 scanning', help: 'Targets are IPv6 addresses.', level: 'Intermediate' },
  { flag: '--privileged', group: 'Misc', label: 'Assume full privileges', help: 'For capability-based setups.', level: 'Advanced' },
  { flag: '--unprivileged', group: 'Misc', label: 'Assume no raw socket rights', help: 'Forces connect-style scans.', level: 'Advanced' },
  { flag: '--send-eth', group: 'Misc', label: 'Send raw Ethernet frames', help: '', level: 'Advanced', root: true },
  { flag: '--send-ip', group: 'Misc', label: 'Send raw IP packets', help: '', level: 'Advanced', root: true },
  { flag: '--datadir', group: 'Misc', value: '/path', label: 'Custom data directory', help: '', level: 'Advanced' },
  { flag: '-V', group: 'Misc', label: 'Print Nmap version', help: 'Use on its own: nmap -V.', level: 'Beginner' },
  { flag: '-h', group: 'Misc', label: 'Help summary', help: 'Use on its own: nmap -h.', level: 'Beginner' },
];

export interface ChosenOption { flag: string; value?: string }

const clean = (v: string) => v.replace(/[^A-Za-z0-9.:/,\-_=@ "'*()]/g, '').trim();

/** Turns chosen options into argument strings, sanitising values and dropping empty ones. */
export function optionArgs(chosen: ChosenOption[]): string[] {
  return chosen.flatMap(c => {
    const def = nmapOptions.find(o => o.flag === c.flag); if (!def) return [];
    if (def.value === undefined) return [def.flag];
    const v = clean(c.value ?? def.value); if (!v) return def.flag.startsWith('-P') ? [def.flag] : [];
    const glued = /^-P[SAUYO]$/.test(def.flag); // -PS22,80 style
    const quoted = /\s/.test(v) && !/^["']/.test(v) ? `"${v}"` : v;
    return [glued ? `${def.flag}${v}` : `${def.flag} ${quoted}`];
  });
}

/** Toggling an option removes others in the same exclusive group (e.g. one timing template). */
export function toggleOption(chosen: ChosenOption[], flag: string): ChosenOption[] {
  if (chosen.some(c => c.flag === flag)) return chosen.filter(c => c.flag !== flag);
  const def = nmapOptions.find(o => o.flag === flag);
  const kept = def?.exclusive ? chosen.filter(c => nmapOptions.find(o => o.flag === c.flag)?.exclusive !== def.exclusive) : chosen;
  return [...kept, { flag, ...(def?.value !== undefined ? { value: def.value } : {}) }];
}

/** Explains each token of the built command, in order. */
export function explainCommand(scanFlag: string, scanName: string, chosen: ChosenOption[]): { arg: string; meaning: string }[] {
  const out = [{ arg: 'nmap', meaning: 'The Nmap program.' }];
  if (scanFlag) out.push({ arg: scanFlag, meaning: scanName });
  for (const c of chosen) { const d = nmapOptions.find(o => o.flag === c.flag); if (d) out.push({ arg: optionArgs([c])[0] ?? d.flag, meaning: `${d.label}.${d.help ? ' ' + d.help : ''}` }); }
  return out;
}

export interface CommandProfile { needsRoot: boolean; noise: 'Low' | 'Medium' | 'High'; speed: 'Fast' | 'Medium' | 'Slow'; warnings: string[] }

/** Rough, illustrative profile of a command for learners. */
export function profileCommand(scanRoot: boolean, scanFlag: string, chosen: ChosenOption[]): CommandProfile {
  const defs = chosen.map(c => nmapOptions.find(o => o.flag === c.flag)).filter((d): d is NmapOption => !!d);
  const has = (f: string) => chosen.some(c => c.flag === f);
  let noise = 1; let slow = 1; const warnings: string[] = [];
  if (defs.some(d => d.noisy) || scanFlag === '-sT') noise++;
  if (has('-sV') || has('-sC') || has('--script')) noise++;
  if (has('-T2') || has('-T1') || has('-T0') || has('--max-rate')) noise = Math.max(1, noise - 1);
  if (has('-p-')) slow++; if (scanFlag === '-sU') slow += 2; if (has('-T0') || has('-T1') || has('-T2')) slow++; if (has('--version-all')) slow++;
  if (has('-T4') || has('-T5') || has('-F') || has('--min-rate')) slow = Math.max(1, slow - 1);
  if (scanFlag === '-sn' && chosen.some(c => ['-p', '-p-', '-F', '--top-ports'].includes(c.flag))) warnings.push('-sn skips port scanning, so port options are ignored.');
  if (scanFlag === '-sU' && has('-p-')) warnings.push('UDP on all ports can take many hours. Try --top-ports 20 first.');
  if (has('-T5')) warnings.push('-T5 can miss open ports on slower networks.');
  if (has('-S') && !has('-e')) warnings.push('Spoofing a source usually also needs -e <interface> and -Pn.');
  if (has('-iR')) warnings.push('-iR scans random internet hosts. Only scan systems you have permission to test.');
  if (!has('-oX') && !has('-oA')) warnings.push('Add -oX (or -oA) to save a file you can open in Scan Map.');
  return { needsRoot: scanRoot || defs.some(d => d.root), noise: (['Low', 'Medium', 'High'] as const)[Math.min(noise, 3) - 1]!, speed: (['Fast', 'Medium', 'Slow'] as const)[Math.min(slow, 3) - 1]!, warnings };
}

export interface Presets { id: string; name: string; level: Level; scan: string; flags: ChosenOption[]; why: string }
const o = (flag: string, value?: string): ChosenOption => (value === undefined ? { flag } : { flag, value });
export const presets: Presets[] = [
  { id: 'first', name: 'Safe first look', level: 'Beginner', scan: '-sT', flags: [o('-F'), o('-T3'), o('-oX', 'scan.xml')], why: 'Works without admin rights and touches only common ports.' },
  { id: 'inventory', name: 'Home network inventory', level: 'Beginner', scan: '-sS', flags: [o('-sV'), o('-O'), o('--open'), o('-oX', 'scan.xml')], why: 'Which devices run what, with versions and OS guesses.' },
  { id: 'audit', name: 'Thorough audit of one device', level: 'Intermediate', scan: '-sS', flags: [o('-p-'), o('-sV'), o('-sC'), o('-T4'), o('--reason'), o('-oX', 'scan.xml')], why: 'All ports, versions and default scripts.' },
  { id: 'udp', name: 'Common UDP services', level: 'Intermediate', scan: '-sU', flags: [o('--top-ports', '20'), o('-sV'), o('-oX', 'scan.xml')], why: 'DNS, SNMP, DHCP and friends — slow, so keep it to 20 ports.' },
  { id: 'firewall', name: 'Map a firewall', level: 'Advanced', scan: '-sA', flags: [o('-p', '1-1024'), o('--reason'), o('-oX', 'scan.xml')], why: 'See which ports are filtered rather than open.' },
  { id: 'quiet', name: 'Low-and-slow', level: 'Advanced', scan: '-sS', flags: [o('-T1'), o('--randomize-hosts'), o('--data-length', '20'), o('-F'), o('-oX', 'scan.xml')], why: 'Slow, shuffled probes for networks that rate-limit scans.' },
];

const scanFlagList: { flag: string; meaning: string }[] = [
  ['-sS', 'SYN scan'], ['-sT', 'TCP connect scan'], ['-sU', 'UDP scan'], ['-sA', 'ACK scan'], ['-sF', 'FIN scan'], ['-sN', 'NULL scan'], ['-sX', 'Xmas scan'], ['-sW', 'Window scan'], ['-sM', 'Maimon scan'], ['-sI', 'Idle (zombie) scan'], ['-sY', 'SCTP INIT scan'], ['-sO', 'IP protocol scan'],
].map(([flag, meaning]) => ({ flag: flag!, meaning: `${meaning}.` }));

/** Explains a pasted nmap command token by token. Unknown flags are reported, not guessed. */
export function explainPasted(cmd: string): { arg: string; meaning: string; known: boolean }[] {
  const tokens = cmd.trim().split(/\s+/).filter(Boolean);
  const out: { arg: string; meaning: string; known: boolean }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t === 'sudo') { out.push({ arg: t, meaning: 'Run with administrator rights (needed for raw-packet scans).', known: true }); continue; }
    if (t === 'nmap') { out.push({ arg: t, meaning: 'The Nmap program.', known: true }); continue; }
    if (!t.startsWith('-')) { out.push({ arg: t, meaning: /^[\w.\-/:]+$/.test(t) ? 'A target (host, range or network) — or the value of the option before it.' : 'Unrecognised text.', known: /^[\w.\-/:]+$/.test(t) }); continue; }
    const flagOnly = t.split('=')[0]!;
    const scan = scanFlagList.find(s => s.flag === t);
    const direct = nmapOptions.find(d => d.flag === flagOnly);
    const glued = /^-P[SAUYO]./.test(t) ? nmapOptions.find(d => d.flag === t.slice(0, 3)) : undefined;
    const verbose = /^-v+$/.test(t) ? nmapOptions.find(d => d.flag === '-v') : /^-d+$/.test(t) ? nmapOptions.find(d => d.flag === '-d') : undefined;
    const timing = /^-T[0-5]$/.test(t) ? nmapOptions.find(d => d.flag === t) : undefined;
    const aliases: Record<string, string> = { '-sC': '--script default', '--script=default': '--script default' };
    const def = scan ? null : direct ?? glued ?? verbose ?? timing;
    if (scan) out.push({ arg: t, meaning: scan.meaning, known: true });
    else if (def) out.push({ arg: t, meaning: `${def.label}.${def.help ? ' ' + def.help : ''}`, known: true });
    else if (aliases[t]) out.push({ arg: t, meaning: 'Run the default scripts.', known: true });
    else out.push({ arg: t, meaning: 'Not in Pktivo’s option list — check `nmap --help` or the Nmap Reference Guide.', known: false });
  }
  return out;
}
