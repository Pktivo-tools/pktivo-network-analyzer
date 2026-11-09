import { Dissector } from './dissect';
import type { Packet, RawPacket } from './types';

const encode = (s: string) => new TextEncoder().encode(s);
function frame(src: string, dst: string, sport: number, dport: number, payload: Uint8Array, udp = false, flags = 0x18, seq = 1): Uint8Array {
  const size = udp ? 8 : 20;
  const data = new Uint8Array(34 + size + payload.length);
  const v = new DataView(data.buffer);
  data.set([0x00,0x15,0x5d,0x12,0x34,0x56,0x3c,0x22,0xfb,0x81,0x10,0x04,0x08,0x00]);
  data[14] = 0x45; v.setUint16(16, data.length - 14); data[22] = 64; data[23] = udp ? 17 : 6;
  data.set(src.split('.').map(Number), 26); data.set(dst.split('.').map(Number), 30);
  v.setUint16(34,sport); v.setUint16(36,dport);
  if (udp) v.setUint16(38,8 + payload.length);
  else { v.setUint32(38,seq); v.setUint32(42,1); data[46]=0x50; data[47]=flags; v.setUint16(48,64240); }
  data.set(payload,34+size); return data;
}
function dns(name: string, response: boolean) {
  const labels = name.split('.').flatMap(s => [s.length,...encode(s)]);
  return new Uint8Array([0x6a,0x21,response ? 0x81 : 0x01,response ? 0x80 : 0,0,1,0,response ? 1 : 0,0,0,0,0,...labels,0,0,1,0,1,...(response ? [0xc0,0x0c,0,1,0,1,0,0,0,60,0,4,93,184,216,34] : [])]);
}
export function demoRaw(): RawPacket[] {
  const raws: RawPacket[] = [];
  const add = (data: Uint8Array) => raws.push({ts:1794218400+raws.length*0.032+(raws.length%7)*0.001,capLen:data.length,origLen:data.length,linkType:1,data});
  for (let i=0;i<24;i++) {
    const port=51000+i;
    add(frame('192.168.1.108','192.168.1.1',port,53,dns(i%2?'api.github.com':'example.com',false),true));
    add(frame('192.168.1.1','192.168.1.108',53,port,dns(i%2?'api.github.com':'example.com',true),true));
    add(frame('192.168.1.108','93.184.216.34',port,80,new Uint8Array(),false,2,0));
    add(frame('93.184.216.34','192.168.1.108',80,port,new Uint8Array(),false,0x12,0));
    add(frame('192.168.1.108','93.184.216.34',port,80,encode(`GET /${i ? 'assets/app.js' : ''} HTTP/1.1\r\nHost: example.com\r\nUser-Agent: Netpack\r\n\r\n`)));
    add(frame('93.184.216.34','192.168.1.108',80,port,encode('HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 19\r\n\r\nHello from Netpack!\n')));
    add(frame('192.168.1.108','142.250.185.46',port,443,new Uint8Array([23,3,3,0,24,...Array.from({length:24},(_,n)=>(n*13+i)%256)])));
    add(frame('142.250.185.46','192.168.1.108',443,port,new Uint8Array([23,3,3,0,32,...Array.from({length:32},(_,n)=>(n*17+i)%256)])));
    add(frame('192.168.1.108','1.1.1.1',port,443,new Uint8Array([0xc0,0,0,0,1,4,0x11,0x22,0x33,0x44,0]),true));
    add(frame('192.168.1.108','192.168.1.1',port,80,new Uint8Array(),false,0x14));
  }
  return raws;
}
export function demoPackets(): Packet[] { const d = new Dissector(); return demoRaw().map(p=>d.dissect(p)); }