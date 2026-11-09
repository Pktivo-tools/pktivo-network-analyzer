import { describe, expect, it } from 'vitest';
import { analyzePackets } from '@/lib/netlens/findings';
import { demoPackets } from '@/lib/netlens/demo';
import type { Packet } from '@/lib/netlens/types';
function packet(fields:Record<string,string|number>={},extra:Partial<Packet>={}):Packet {
  const base=demoPackets()[0];if(!base)throw new Error('Missing sample');
  return {...base,no:1,layers:['tcp'],info:'',capLen:base.len,fields:new Map(Object.entries(fields).map(([k,v])=>[k,[v]])),...extra};
}
describe('Automatic local warning rules',()=>{
  it('flags readable HTTP authorization for review',()=>{expect(analyzePackets([packet({'http.authorization':'Basic test'})]).find(f=>f.id==='cleartext-auth')?.packetNos).toEqual([1])});
  it('does not treat encrypted traffic as readable HTTP',()=>{expect(analyzePackets([packet({}, {layers:['tcp','tls']})]).map(f=>f.id)).not.toContain('cleartext-http')});
  it('marks plain HTTP as informational rather than proof of an attack',()=>{expect(analyzePackets([packet({}, {layers:['tcp','http']})]).find(f=>f.id==='cleartext-http')?.level).toBe('notice')});
  it('marks only non-existent DNS name responses',()=>{expect(analyzePackets([packet({'dns.flags.response':1,'dns.flags.rcode':3})]).map(f=>f.id)).toContain('dns-failed');expect(analyzePackets([packet({'dns.flags.response':0,'dns.flags.rcode':3}),packet({'dns.flags.response':1,'dns.flags.rcode':0})])).toEqual([])});
  it('marks resets as informational',()=>{expect(analyzePackets([packet({'tcp.flags.reset':1})]).find(f=>f.id==='reset')?.level).toBe('notice')});
  it('detects capture truncation independently of malformed structure',()=>{expect(analyzePackets([packet({}, {len:100,capLen:60})]).map(f=>f.id)).toContain('incomplete');expect(analyzePackets([packet({}, {info:'[Malformed Packet]'})]).map(f=>f.id)).toContain('incomplete')});
  function probes(count:number,interval=0.4){return Array.from({length:count},(_,i)=>packet({'tcp.flags.syn':1,'tcp.flags.ack':0,'tcp.dstport':1000+i},{no:i+1,ts:i*interval,netSrc:'192.168.1.2',netDst:'192.168.1.3'}))}
  it('detects 20 different ports in 10 seconds, not 19',()=>{expect(analyzePackets(probes(20)).find(f=>f.id==='possible-scan')?.packetNos).toHaveLength(20);expect(analyzePackets(probes(19)).map(f=>f.id)).not.toContain('possible-scan')});
  it('does not flag slow probes or repeated retries on one port',()=>{expect(analyzePackets(probes(20,1)).map(f=>f.id)).not.toContain('possible-scan');expect(analyzePackets(probes(20).map(p=>({...p,fields:new Map([...p.fields,['tcp.dstport',[443]]])}))).map(f=>f.id)).not.toContain('possible-scan')});
  it('does not combine unrelated targets or SYN acknowledgments',()=>{expect(analyzePackets(probes(20).map((p,i)=>({...p,netDst:`192.168.1.${i}`}))).map(f=>f.id)).not.toContain('possible-scan');expect(analyzePackets(probes(20).map(p=>({...p,fields:new Map([...p.fields,['tcp.flags.ack',[1]]])}))).map(f=>f.id)).not.toContain('possible-scan')});
});