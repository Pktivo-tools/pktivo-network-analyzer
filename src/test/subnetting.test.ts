import { describe, expect, it } from 'vitest';
import { subnet, prefixForHosts, makeSubnetQuestion, checkSubnetAnswer } from '@/lib/learn/subnetting';

describe('subnetting course calculations', () => {
  it('finds an ordinary /26 network, mask and usable range', () => {
    expect(subnet('192.168.10.77', 26)).toMatchObject({ network: '192.168.10.64', broadcast: '192.168.10.127', first: '192.168.10.65', last: '192.168.10.126', mask: '255.255.255.192', hosts: 62, size: 64 });
  });
  it('handles subnet boundaries crossing octets', () => {
    expect(subnet('172.16.35.10', 20)).toMatchObject({ network: '172.16.32.0', broadcast: '172.16.47.255', mask: '255.255.240.0', hosts: 4094 });
  });
  it('supports point-to-point /31 without inventing a broadcast', () => {
    expect(subnet('10.0.0.1', 31)).toMatchObject({ first: '10.0.0.0', last: '10.0.0.1', broadcast: null, hosts: 2 });
  });
  it('supports a /32 host route and the full /0 range', () => {
    expect(subnet('10.0.0.1', 32)).toMatchObject({ network: '10.0.0.1', first: '10.0.0.1', last: '10.0.0.1', broadcast: null, hosts: 1 });
    expect(subnet('255.255.255.255', 0)).toMatchObject({ network: '0.0.0.0', broadcast: '255.255.255.255', mask: '0.0.0.0', hosts: 4294967294 });
  });
  it('chooses the smallest ordinary LAN with enough host addresses', () => {
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(100)).toBe(25);
    expect(prefixForHosts(20)).toBe(27);
  });
  it('rejects invalid addresses and prefixes', () => {
    expect(() => subnet('256.1.1.1', 24)).toThrow();
    expect(() => subnet('1.2.3', 24)).toThrow();
    expect(() => subnet('1.2.3.4', 33)).toThrow();
    expect(() => subnet('1.2.3.4', 2.5)).toThrow();
  });
  it('generates beginner, intermediate and advanced questions with checked answers', () => {
    expect(makeSubnetQuestion('Beginner', () => 0).answer).toBe('255.255.255.0');
    expect(makeSubnetQuestion('Intermediate', () => 0.6).answer).toBe('192.168.153.128');
    expect(makeSubnetQuestion('Advanced', () => 0.99).answer).toBe('/23');
    expect(checkSubnetAnswer(' 23 ', '/23')).toBe(true);
    expect(checkSubnetAnswer('/24', '/23')).toBe(false);
    expect(checkSubnetAnswer('63', '62')).toBe(false);
  });
});