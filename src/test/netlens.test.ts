import { describe, expect, it } from 'vitest';
import { demoPackets, demoRaw } from '@/lib/netlens/demo';
import { parseCapture, CaptureParser } from '@/lib/netlens/capture-parser';
import { writePcapng } from '@/lib/netlens/writer';
import { compileFilter } from '@/lib/netlens/filter';
import { followStream } from '@/lib/netlens/streams';
import { computeStats } from '@/lib/netlens/stats';
import { buildTree } from '@/lib/netlens/dissect';

describe('Pktivo capture analysis',()=>{
  it('round-trips actual packet bytes through PCAPNG',()=>{
    const raw=demoRaw();const result=parseCapture(writePcapng(raw));
    expect(result).toHaveLength(240);expect(result[4]?.data).toEqual(raw[4]?.data);
    expect(result[4]?.ts).toBeCloseTo(raw[4]?.ts??0,5);
  });
  it('parses a live capture split at arbitrary boundaries without dropping frames',()=>{
    const bytes=writePcapng(demoRaw());const parser=new CaptureParser();const result=[];
    for(let i=0;i<bytes.length;i+=17)result.push(...parser.push(bytes.slice(i,i+17)));
    expect(result).toHaveLength(240);expect(result[239]?.data).toEqual(demoRaw()[239]?.data);
  });
  it('filters TCP port 443 independently of UDP port 443',()=>{
    const filter=compileFilter('tcp.port == 443');expect(filter.ok).toBe(true);
    if(!filter.ok)return;const result=demoPackets().filter(filter.test);
    expect(result).toHaveLength(48);expect(result.every(p=>p.layers.includes('tcp'))).toBe(true);
  });
  it('supports local-network CIDR and boolean flags',()=>{
    const filter=compileFilter('ip.addr == 192.168.0.0/16 and tcp.flags.syn and not tcp.flags.ack');
    if(!filter.ok)throw new Error(filter.error);
    expect(demoPackets().filter(filter.test)).toHaveLength(24);
  });
  it('rebuilds request and response payloads from the same stream',()=>{
    const packets=demoPackets();const ref=packets[4]?.stream;if(!ref)throw new Error('Missing HTTP stream');
    const stream=followStream(packets,ref.kind,ref.index);
    expect(new TextDecoder().decode(stream.segments[0]?.bytes)).toContain('GET / HTTP/1.1');
    expect(new TextDecoder().decode(stream.segments[1]?.bytes)).toContain('HTTP/1.1 200 OK');
  });
  it('calculates packet totals and returns inspectable layer details',()=>{
    const packets=demoPackets();const stats=computeStats(packets);
    expect(stats.packets).toBe(240);expect(stats.bytes).toBe(packets.reduce((n,p)=>n+p.len,0));
    expect(stats.io.reduce((n,b)=>n+b.packets,0)).toBe(240);
    const packet=packets[4];if(!packet)throw new Error('Missing packet');expect(buildTree(packet).length).toBeGreaterThan(3);
  });
});