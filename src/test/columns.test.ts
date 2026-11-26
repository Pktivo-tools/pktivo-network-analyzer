import { describe, expect, it } from 'vitest';
import { demoPackets } from '@/lib/netlens/demo';
import { buildNameIndex } from '@/lib/netlens/packet-story';
import { describeRow } from '@/lib/netlens/columns';
import { compileFilter } from '@/lib/netlens/filter';

const packets = demoPackets();
const index = buildNameIndex(packets);
const at = (no: number) => {
  const p = packets.find((x) => x.no === no);
  if (!p) throw new Error(`missing packet ${no}`);
  return p;
};

describe('plain-language packet columns', () => {
  it('describes a name lookup in words and points at the raw field', () => {
    const row = describeRow(at(1), index);
    expect(row.text).toBe('Asking where example.com lives');
    expect(row.filter).toBe('dns.qry.name == example.com');
  });
  it('describes a name answer as a reply about the same name', () => {
    expect(describeRow(at(2), index).text).toBe('Reply about example.com');
  });
  it('describes a web request with its method, path and host', () => {
    const row = describeRow(at(5), index);
    expect(row.text).toBe('GET / · example.com');
    expect(row.filter).toBe('http.host == example.com');
  });
  it('describes a web reply with its status code', () => {
    const row = describeRow(at(6), index);
    expect(row.text).toBe('Web reply 200 OK');
    expect(row.filter).toBe('http.response.code == 200');
  });
  it('describes connection setup, acceptance and a sudden ending', () => {
    expect(describeRow(at(3), index).text).toBe('Opening a connection to 93.184.216.34:80');
    expect(describeRow(at(4), index).text).toBe('93.184.216.34 accepted the connection');
    expect(describeRow(at(10), index).text).toBe('Connection cut short by a reset');
  });
  it('describes encrypted traffic and a plain message to a port', () => {
    expect(describeRow(at(7), index).text).toBe('Encrypted traffic');
    expect(describeRow(at(9), index).text).toBe('Message to 1.1.1.1:443');
  });
  it('keeps every description clickable with a filter that actually works', () => {
    for (const p of packets) {
      const row = describeRow(p, index);
      const check = compileFilter(row.filter);
      if (!check.ok) throw new Error(`packet ${p.no} label filter "${row.filter}" failed: ${check.error}`);
      expect(row.text.length).toBeGreaterThan(0);
    }
  });
});
