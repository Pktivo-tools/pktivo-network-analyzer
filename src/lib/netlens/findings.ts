import type { Packet } from './types';

export interface Finding {
  id: string;
  level: 'review' | 'notice';
  title: string;
  explanation: string;
  next: string;
  packetNos: number[];
}
const number = (p: Packet, key: string) => Number(p.fields.get(key)?.[0] ?? 0);
export function analyzePackets(packets: Packet[]): Finding[] {
  const findings: Finding[] = [];
  function add(id: string, level: Finding['level'], title: string, explanation: string, next: string, matches: Packet[]) {
    if (matches.length) findings.push({ id, level, title, explanation, next, packetNos: matches.map(p => p.no) });
  }
  add('cleartext-auth', 'review', 'A login was sent without encryption', 'An HTTP message contains an Authorization header. Someone who can see this traffic may be able to read its login information.', 'Use HTTPS and check whether this was an expected test. Do not share the packet contents.', packets.filter(p => p.fields.has('http.authorization')));
  add('cleartext-http', 'notice', 'Some web traffic is not encrypted', 'HTTP messages are readable on the network. This can be normal for local devices or test traffic; it does not prove an attack.', 'Prefer HTTPS for private information.', packets.filter(p => p.layers.includes('http')));
  add('dns-failed', 'notice', 'A website name could not be found', 'A DNS reply says the requested name does not exist. A typo, outdated link, or blocked domain can cause this.', 'Check the spelling and try the website again.', packets.filter(p => number(p, 'dns.flags.response') === 1 && number(p, 'dns.flags.rcode') === 3));
  add('reset', 'notice', 'A connection ended suddenly', 'A TCP reset stopped a conversation. Apps, closed ports, and network equipment can do this; a reset alone is not suspicious.', 'If an app is failing, check the packets just before the reset.', packets.filter(p => number(p, 'tcp.flags.reset') === 1));
  add('incomplete', 'notice', 'Some messages are incomplete', 'The saved packet is shorter than the original, or its structure could not be read. Capture settings and damaged files can cause this.', 'Try a new capture with complete packets before drawing conclusions.', packets.filter(p => p.capLen < p.len || p.info.includes('[Malformed Packet]')));
  // Sliding ten-second window, distinct destination ports for the same source and target.
  const groups = new Map<string, Packet[]>();
  for (const p of packets) if (number(p, 'tcp.flags.syn') === 1 && number(p, 'tcp.flags.ack') === 0) {
    const key = JSON.stringify([p.netSrc, p.netDst]);
    const group = groups.get(key) ?? []; group.push(p); groups.set(key, group);
  }
  const scan = new Map<number, Packet>();
  for (const group of groups.values()) {
    group.sort((a,b) => a.ts - b.ts);
    let left = 0;
    const ports = new Map<number, number>();
    for (let right = 0; right < group.length; right++) {
      const current = group[right]; if (!current) continue;
      const port = number(current, 'tcp.dstport'); ports.set(port, (ports.get(port) ?? 0) + 1);
      while (left < right) {
        const first = group[left]; if (!first || current.ts - first.ts <= 10) break;
        const old = number(first, 'tcp.dstport'); const count = (ports.get(old) ?? 1) - 1;
        if (count) ports.set(old, count); else ports.delete(old); left++;
      }
      if (ports.size >= 20) for (let i=left;i<=right;i++) { const p=group[i]; if(p)scan.set(p.no,p); }
    }
  }
  add('possible-scan', 'review', 'One device tried many doors', 'A device started connections to at least 20 different ports on the same target within 10 seconds. This may be a port scan, but approved security checks can look the same.', 'Check whether you expected a security scan. Ask the network owner before taking action.', [...scan.values()]);
  return findings;
}