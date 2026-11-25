import type { Packet } from './types';
import { computeStats } from './stats';
import { analyzePackets } from './findings';

const field = (p: Packet, key: string) => p.fields.get(key)?.[0];
const numeric = (p: Packet, key: string) => Number(field(p, key) ?? 0);

/** Only measures observed request/reply pairs, not whole website load times. */
export function observedTimings(packets: Packet[]) {
  const dns = new Map<string, number>();
  const syn = new Map<string, number>();
  const dnsMs: number[] = [];
  const tcpMs: number[] = [];
  for (const p of [...packets].sort((a, b) => a.ts - b.ts)) {
    const transport = p.layers.includes('tcp') ? 'tcp' : 'udp';
    const forward = [p.netSrc, numeric(p, `${transport}.srcport`), p.netDst, numeric(p, `${transport}.dstport`)];
    const reverse = [p.netDst, numeric(p, `${transport}.dstport`), p.netSrc, numeric(p, `${transport}.srcport`)];
    if (field(p, 'dns.id') !== undefined) {
      const response = numeric(p, 'dns.flags.response') === 1;
      const key = JSON.stringify([transport, ...(response ? reverse : forward), field(p, 'dns.id')]);
      if (!response) { if (!dns.has(key)) dns.set(key, p.ts); }
      else { const start = dns.get(key); if (start !== undefined) { dnsMs.push((p.ts - start) * 1000); dns.delete(key); } }
    }
    if (numeric(p, 'tcp.flags.syn') === 1) {
      const ack = numeric(p, 'tcp.flags.ack') === 1;
      const seq = ack ? (numeric(p, 'tcp.ack_raw') - 1 + 2 ** 32) % 2 ** 32 : numeric(p, 'tcp.seq_raw');
      const key = JSON.stringify([...(ack ? reverse : forward), seq]);
      if (!ack) { if (!syn.has(key)) syn.set(key, p.ts); }
      else { const start = syn.get(key); if (start !== undefined) { tcpMs.push((p.ts - start) * 1000); syn.delete(key); } }
    }
  }
  const summary = (values: number[]) => ({ pairs: values.length, averageMs: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null });
  return { dns: summary(dnsMs), tcp: summary(tcpMs) };
}

export function summarizeCapture(packets: Packet[]) {
  const findings = analyzePackets(packets);
  const stats = computeStats(packets);
  return { stats, timings: observedTimings(packets), findings, flagged: new Set(findings.flatMap(f => f.packetNos)).size };
}

export function compareCaptures(a: Packet[], b: Packet[]) {
  const left = summarizeCapture(a), right = summarizeCapture(b);
  const names = [...new Set([...left.stats.protocols, ...right.stats.protocols].map(p => p.name))].sort();
  const protocols = names.map(name => {
    const before = left.stats.protocols.find(p => p.name === name)?.packets ?? 0;
    const after = right.stats.protocols.find(p => p.name === name)?.packets ?? 0;
    return { name, before, after, beforeShare: a.length ? before / a.length * 100 : 0, afterShare: b.length ? after / b.length * 100 : 0 };
  });
  const warningIds = [...new Set([...left.findings, ...right.findings].map(f => f.id))];
  const warnings = warningIds.map(id => {
    const before = left.findings.find(f => f.id === id), after = right.findings.find(f => f.id === id);
    return { id, title: before?.title ?? after?.title ?? id, before: before?.packetNos.length ?? 0, after: after?.packetNos.length ?? 0 };
  });
  return { left, right, protocols, warnings };
}