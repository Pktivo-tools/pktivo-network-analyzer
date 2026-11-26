import { describe, expect, it } from 'vitest';
import { demoPackets } from '@/lib/netlens/demo';
import { bareProtocolList, compileFilter } from '@/lib/netlens/filter';
import { FIELD_MAP, PROTO_ALIASES, PROTO_NAMES } from '@/lib/netlens/fields';

const packets = demoPackets();

function hits(filter: string) {
  const r = compileFilter(filter);
  if (!r.ok) throw new Error(`${filter}: ${r.error}`);
  return packets.filter(r.test);
}

describe('protocol search in the filter bar', () => {
  it('shows only the packets labelled with the protocol that was typed', () => {
    expect(hits('tcp').map((p) => p.protocol)).toEqual(Array(72).fill('TCP'));
    expect(hits('http').every((p) => p.protocol === 'HTTP')).toBe(true);
    expect(hits('quic').every((p) => p.protocol === 'QUIC')).toBe(true);
    expect(hits('tls').every((p) => p.protocol.startsWith('TLS'))).toBe(true);
  });

  it('keeps the wider "frames carrying this protocol" view reachable', () => {
    expect(hits('tcp').length).toBe(72);
    expect(hits('tcp.frame').length).toBe(168);
    expect(new Set(hits('tcp.frame').map((p) => p.protocol))).toEqual(new Set(['TCP', 'HTTP', 'TLSv1.2']));
  });

  it('accepts every protocol name and every alias in the registry', () => {
    for (const name of PROTO_NAMES) expect(compileFilter(name).ok, name).toBe(true);
    for (const alias of Object.keys(PROTO_ALIASES)) expect(compileFilter(alias).ok, alias).toBe(true);
  });

  it('registers a "<protocol>.frame" field for every protocol that needs one', () => {
    for (const name of PROTO_NAMES) {
      if (name === 'frame' || PROTO_ALIASES[name]) continue;
      expect(FIELD_MAP.get(`${name}.frame`)?.type, name).toBe('bool');
    }
    expect(FIELD_MAP.has('frame.frame')).toBe(false);
  });

  it('lets each protocol label shown in the capture be typed back into the bar', () => {
    for (const p of packets) {
      expect(compileFilter(p.top).ok, p.top).toBe(true);
      expect(hits(p.top).some((h) => h.no === p.no), `${p.protocol} -> ${p.top}`).toBe(true);
    }
  });

  it('resolves aliases to the same packets as the canonical name', () => {
    expect(hits('ipv4').length).toBe(hits('ip').length);
    expect(hits('ethernet').length).toBe(hits('eth').length);
    expect(hits('loopback').length).toBe(hits('null').length);
  });

  it('covers TLS versions and mDNS under their family names', () => {
    const base = packets[0];
    if (!base) throw new Error('Missing fixture');
    const mdns = { ...base, top: 'mdns', protocol: 'mDNS', layers: [...base.layers, 'mdns'] };
    const dns = compileFilter('dns');
    if (!dns.ok) throw new Error(dns.error);
    expect(dns.test(mdns)).toBe(true);
    const v12 = compileFilter('tlsv1.2');
    if (!v12.ok) throw new Error(v12.error);
    expect(v12.test({ ...base, top: 'tlsv1.2' })).toBe(true);
    expect(v12.test({ ...base, top: 'tls' })).toBe(false);
    const tls = compileFilter('tls');
    if (!tls.ok) throw new Error(tls.error);
    expect(tls.test({ ...base, top: 'tlsv1.2' })).toBe(true);
  });

  it('offers the wider view only when the filter is just protocol names', () => {
    expect(bareProtocolList('tcp')).toEqual(['tcp']);
    expect(bareProtocolList('dns or mdns')).toEqual(['dns', 'mdns']);
    expect(bareProtocolList('tcp.port == 443')).toBeNull();
    expect(bareProtocolList('not tcp')).toBeNull();
    expect(bareProtocolList('')).toBeNull();
  });
});
