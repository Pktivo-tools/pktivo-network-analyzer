import { describe, expect, it } from 'vitest';
import { demoPackets, demoRaw } from '@/lib/netlens/demo';
import { Dissector } from '@/lib/netlens/dissect';
import { assessHealth, msText } from '@/lib/netlens/health';

describe('capture health check', () => {
  const report = assessHealth(demoPackets());
  it('measures name lookups, connection setup and the first reply', () => {
    const dns = report.phases.find((p) => p.id === 'dns');
    const handshake = report.phases.find((p) => p.id === 'handshake');
    const firstByte = report.phases.find((p) => p.id === 'first-byte');
    expect(dns?.samples).toBe(2);
    expect(handshake?.samples).toBe(24);
    expect(firstByte?.samples).toBe(48);
    expect(dns?.status).toBe('ok');
    expect(handshake?.medianMs).toBeGreaterThan(0);
  });
  it('calls a step not visible when the capture contains none of it', () => {
    const tls = report.phases.find((p) => p.id === 'tls');
    expect(tls?.status).toBe('missing');
    expect(tls?.medianMs).toBeNull();
    expect(tls?.packetNos).toEqual([]);
  });
  it('counts only the connections whose setup was answered', () => {
    expect(report.connections).toBe(72);
    expect(report.answered).toBe(24);
  });
  it('reports the resets in the sample capture as something to look at', () => {
    expect(report.verdict).toBe('watch');
    expect(report.headline).toBe('A few things are worth a look');
    const reset = report.problems.find((p) => p.id === 'reset');
    expect(reset?.packetNos).toHaveLength(24);
    expect(reset?.level).toBe('notice');
    expect(report.affected).toBe(24);
  });
  it('says a capture is healthy once the sudden endings are gone', () => {
    const withoutResets = demoRaw().filter((_, i) => i % 10 !== 9);
    const dissector = new Dissector();
    const clean = assessHealth(withoutResets.map((r) => dissector.dissect(r)));
    expect(clean.verdict).toBe('healthy');
    expect(clean.problems).toEqual([]);
    expect(clean.headline).toBe('This capture looks healthy');
  });
  it('never mixes the two directions of a conversation when looking for repeated data', () => {
    const report = assessHealth(demoPackets());
    expect(report.problems.map((p) => p.id)).not.toContain('retransmission');
    expect(report.problems.map((p) => p.id)).not.toContain('out-of-order');
  });
  it('reads milliseconds the way a beginner would', () => {
    expect(msText(null)).toBe('not visible');
    expect(msText(0.4)).toBe('under 1 ms');
    expect(msText(1500)).toBe('1.50 s');
    expect(msText(33)).toBe('33 ms');
  });
});
