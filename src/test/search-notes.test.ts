import { describe, expect, it } from 'vitest';
import { demoPackets } from '@/lib/netlens/demo';
import { findLikeThis, searchPackets } from '@/lib/netlens/search';
import { notesCsv, notesJson } from '@/lib/netlens/annotations';

const packets = demoPackets();

describe('searching every decoded value', () => {
  it('finds the packets that mention a name', () => {
    const result = searchPackets(packets, 'example.com');
    expect(result.error).toBeNull();
    expect(result.matched.size).toBe(48);
    expect(result.hits.some((h) => h.field === 'dns.qry.name')).toBe(true);
    expect(result.truncated).toBe(false);
  });
  it('finds an address held in a decoded field', () => {
    expect(searchPackets(packets, '93.184').matched.size).toBe(120);
  });
  it('treats the search as a pattern only when asked', () => {
    expect(searchPackets(packets, '^GET', { regex: true }).matched.size).toBeGreaterThan(0);
    expect(searchPackets(packets, '^GET').matched.size).toBe(0);
  });
  it('explains a pattern it cannot use', () => {
    expect(searchPackets(packets, '[', { regex: true }).error).toBe(
      'That pattern is not a valid regular expression.',
    );
  });
  it('says nothing when there is nothing to look for', () => {
    const result = searchPackets(packets, '   ');
    expect(result.hits).toEqual([]);
    expect(result.error).toBeNull();
  });
  it('builds a filter that matches everything like the selected packet', () => {
    const tcp = packets.find((p) => p.stream?.kind === 'tcp');
    const udp = packets.find((p) => p.stream?.kind === 'udp');
    if (!tcp || !udp) throw new Error('sample capture is missing streams');
    expect(findLikeThis(tcp)).toBe(`tcp.stream == ${tcp.stream?.index}`);
    expect(findLikeThis(udp)).toBe(`udp.stream == ${udp.stream?.index}`);
  });
});

describe('marked packets and notes', () => {
  const notes = new Map<number, string>([
    [1, 'Saw "odd" traffic, check'],
    [5, 'fine'],
  ]);
  it('writes notes as CSV with quotes and commas escaped', () => {
    const csv = notesCsv(packets, notes);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('packet_no,time_seconds,source,destination,protocol,length_bytes,note');
    expect(lines).toHaveLength(3);
    expect(csv).toContain('"Saw ""odd"" traffic, check"');
    expect(lines[2]?.endsWith(',fine')).toBe(true);
  });
  it('writes notes as JSON that other tools can read back', () => {
    const items = JSON.parse(notesJson(packets, notes)) as { no: number; note: string; source: string }[];
    expect(items.map((i) => i.no)).toEqual([1, 5]);
    expect(items[0]?.note).toBe('Saw "odd" traffic, check');
    expect(items[0]?.source).toBe('192.168.1.108');
  });
  it('keeps only the packets that actually have a note', () => {
    expect(notesCsv(packets, new Map([[1, '   ']]))).toBe('packet_no,time_seconds,source,destination,protocol,length_bytes,note\n');
    expect(notesJson(packets, new Map())).toBe('[]\n');
  });
});
