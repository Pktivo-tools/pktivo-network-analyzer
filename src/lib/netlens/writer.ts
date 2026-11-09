import type { RawPacket } from "./types";

/** Writes packets as a pcapng file (one interface block per link type). */
export function writePcapng(packets: Pick<RawPacket, "ts" | "data" | "origLen" | "linkType">[]): Uint8Array {
  const linkTypes = [...new Set(packets.map((p) => p.linkType))];
  if (linkTypes.length === 0) linkTypes.push(1);
  const parts: Uint8Array[] = [];

  const shb = new DataView(new ArrayBuffer(28));
  shb.setUint32(0, 0x0a0d0d0a, true);
  shb.setUint32(4, 28, true);
  shb.setUint32(8, 0x1a2b3c4d, true);
  shb.setUint16(12, 1, true);
  shb.setUint16(14, 0, true);
  shb.setInt32(16, -1, true);
  shb.setInt32(20, -1, true);
  shb.setUint32(24, 28, true);
  parts.push(new Uint8Array(shb.buffer));

  for (const lt of linkTypes) {
    const idb = new DataView(new ArrayBuffer(20));
    idb.setUint32(0, 1, true);
    idb.setUint32(4, 20, true);
    idb.setUint16(8, lt, true);
    idb.setUint16(10, 0, true);
    idb.setUint32(12, 0, true);
    idb.setUint32(16, 20, true);
    parts.push(new Uint8Array(idb.buffer));
  }

  for (const p of packets) {
    const padded = (p.data.length + 3) & ~3;
    const total = 32 + padded;
    const buf = new Uint8Array(total);
    const v = new DataView(buf.buffer);
    const micros = Math.round(p.ts * 1e6);
    v.setUint32(0, 6, true);
    v.setUint32(4, total, true);
    v.setUint32(8, linkTypes.indexOf(p.linkType), true);
    v.setUint32(12, Math.floor(micros / 4294967296), true);
    v.setUint32(16, micros % 4294967296, true);
    v.setUint32(20, p.data.length, true);
    v.setUint32(24, p.origLen, true);
    buf.set(p.data, 28);
    v.setUint32(total - 4, total, true);
    parts.push(buf);
  }

  const size = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
