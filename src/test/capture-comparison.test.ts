import { describe, expect, it } from 'vitest';
import { demoPackets } from '@/lib/netlens/demo';
import { compareCaptures, observedTimings } from '@/lib/netlens/comparison';
import type { Packet } from '@/lib/netlens/types';

function packet(no: number, ts: number, fields: Record<string, number>, reverse = false): Packet {
  const base = demoPackets()[0]; if (!base) throw new Error('Missing fixture');
  return { ...base, no, ts, rel: ts, len: 100, layers: ['ip', 'udp'], netSrc: reverse ? '10.0.0.2' : '10.0.0.1', netDst: reverse ? '10.0.0.1' : '10.0.0.2', fields: new Map(Object.entries(fields).map(([key, value]) => [key, [value]])) };
}

describe('private full-capture comparison', () => {
  it('compares full totals and protocol shares without mutating capture packets', () => {
    const a = demoPackets(), b = a.slice(0, 120);
    const result = compareCaptures(a, b);
    expect(result.left.stats.packets).toBe(240);
    expect(result.right.stats.packets).toBe(120);
    expect(result.left.stats.bytes).toBe(a.reduce((n, p) => n + p.len, 0));
    expect(result.protocols.reduce((n, p) => n + p.afterShare, 0)).toBeCloseTo(100);
    expect(a).toHaveLength(240);
  });
  it('matches DNS IDs with reverse endpoints and ports, not unrelated replies', () => {
    const query = packet(1, 1, { 'dns.id': 7, 'dns.flags.response': 0, 'udp.srcport': 50000, 'udp.dstport': 53 });
    const unrelated = packet(2, 1.01, { 'dns.id': 7, 'dns.flags.response': 1, 'udp.srcport': 53, 'udp.dstport': 50001 }, true);
    const reply = packet(3, 1.025, { 'dns.id': 7, 'dns.flags.response': 1, 'udp.srcport': 53, 'udp.dstport': 50000 }, true);
    expect(observedTimings([query, unrelated, reply]).dns).toMatchObject({ pairs: 1 });
    expect(observedTimings([query, unrelated, reply]).dns.averageMs).toBeCloseTo(25);
  });
  it('matches SYN-ACK raw acknowledgments and does not double count replies', () => {
    const syn = packet(1, 1, { 'tcp.flags.syn': 1, 'tcp.flags.ack': 0, 'tcp.seq_raw': 12345, 'tcp.srcport': 50000, 'tcp.dstport': 443 }); syn.layers = ['ip', 'tcp'];
    const reply = packet(2, 1.04, { 'tcp.flags.syn': 1, 'tcp.flags.ack': 1, 'tcp.ack_raw': 12346, 'tcp.srcport': 443, 'tcp.dstport': 50000 }, true); reply.layers = ['ip', 'tcp'];
    expect(observedTimings([syn, reply, reply]).tcp.pairs).toBe(1);
    expect(observedTimings([syn, reply]).tcp.averageMs).toBeCloseTo(40);
  });
  it('reports no timing instead of zero when no pair was captured', () => {
    expect(observedTimings([]).dns).toEqual({ pairs: 0, averageMs: null });
    expect(observedTimings([]).tcp).toEqual({ pairs: 0, averageMs: null });
  });
  it('finds TCP timing pairs from real dissected sample bytes', () => {
    expect(observedTimings(demoPackets()).tcp.pairs).toBe(24);
  });
  it('compares warning packet counts and deduplicates flagged packets', () => {
    const a = packet(1, 1, { 'tcp.flags.reset': 1 });
    const result = compareCaptures([a], []);
    expect(result.left.flagged).toBe(1);
    expect(result.right.flagged).toBe(0);
    expect(result.warnings.find(w => w.id === 'reset')).toMatchObject({ before: 1, after: 0 });
  });
});