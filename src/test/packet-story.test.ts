import { describe, expect, it } from 'vitest';
import { demoPackets } from '@/lib/netlens/demo';
import { buildNameIndex, describePacket, isLocalAddress } from '@/lib/netlens/packet-story';
describe('packet story',()=>{
  it('treats private ranges as local',()=>{expect(isLocalAddress('192.168.1.5')).toBe(true);expect(isLocalAddress('8.8.8.8')).toBe(false)});
  it('names the website for an outgoing HTTP request',()=>{const ps=demoPackets();const idx=buildNameIndex(ps);const req=ps.find(p=>p.fields.has('http.host')&&p.fields.has('http.request'));if(!req)throw new Error('no request');const s=describePacket(req,idx);expect(s.direction).toBe('to-site');expect(s.website).toBe(String(req.fields.get('http.host')?.[0]))});
});
