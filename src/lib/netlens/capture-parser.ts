import type { RawPacket } from "./types";

/**
 * Incremental pcap / pcapng parser. Feed it bytes with push() (a whole file at once,
 * or chunks from a live capture stream) and it returns every complete packet so far.
 */
export class CaptureParser {
  private buf: Uint8Array = new Uint8Array(0);
  private pos = 0;
  private format: "unknown" | "pcap" | "pcapng" = "unknown";
  private le = true;
  private tsDiv = 1e6;
  private linkType = 1;
  private ifaces: { linkType: number; tsDiv: number }[] = [];
  public packetCount = 0;

  get detectedFormat() {
    return this.format;
  }

  push(chunk: Uint8Array): RawPacket[] {
    this.append(chunk);
    const out: RawPacket[] = [];
    for (;;) {
      if (this.format === "unknown") {
        if (!this.detect()) break;
        continue;
      }
      const p = this.format === "pcap" ? this.nextPcap() : this.nextPcapng();
      if (p === false) break;
      if (p) {
        out.push(p);
        this.packetCount++;
      }
    }
    this.compact();
    return out;
  }

  private append(chunk: Uint8Array) {
    const remaining = this.buf.length - this.pos;
    if (remaining === 0) {
      this.buf = chunk;
      this.pos = 0;
      return;
    }
    const merged = new Uint8Array(remaining + chunk.length);
    merged.set(this.buf.subarray(this.pos), 0);
    merged.set(chunk, remaining);
    this.buf = merged;
    this.pos = 0;
  }

  private compact() {
    if (this.pos > 0 && this.pos >= this.buf.length) {
      this.buf = new Uint8Array(0);
      this.pos = 0;
    }
  }

  private view(off: number, len: number) {
    return new DataView(this.buf.buffer, this.buf.byteOffset + off, len);
  }

  private avail() {
    return this.buf.length - this.pos;
  }

  private detect(): boolean {
    if (this.avail() < 4) return false;
    const v = this.view(this.pos, 4);
    const be = v.getUint32(0, false);
    if (be === 0xa1b2c3d4 || be === 0xa1b23c4d) {
      this.le = false;
      this.tsDiv = be === 0xa1b23c4d ? 1e9 : 1e6;
    } else if (be === 0xd4c3b2a1 || be === 0x4d3cb2a1) {
      this.le = true;
      this.tsDiv = be === 0x4d3cb2a1 ? 1e9 : 1e6;
    } else if (be === 0x0a0d0d0a) {
      this.format = "pcapng";
      return true;
    } else {
      throw new Error("This doesn't look like a pcap or pcapng capture file.");
    }
    if (this.avail() < 24) return false;
    const h = this.view(this.pos, 24);
    this.linkType = h.getUint32(20, this.le) & 0x0fffffff;
    this.pos += 24;
    this.format = "pcap";
    return true;
  }

  /** Returns a packet, null for "consumed but nothing to emit", false for "need more bytes". */
  private nextPcap(): RawPacket | null | false {
    if (this.avail() < 16) return false;
    const h = this.view(this.pos, 16);
    const sec = h.getUint32(0, this.le);
    const frac = h.getUint32(4, this.le);
    const capLen = h.getUint32(8, this.le);
    const origLen = h.getUint32(12, this.le);
    if (capLen > 0x4000000) throw new Error("Corrupt capture file (impossible packet length).");
    if (this.avail() < 16 + capLen) return false;
    const start = this.pos + 16;
    const data = this.buf.slice(start, start + capLen);
    this.pos = start + capLen;
    return { ts: sec + frac / this.tsDiv, capLen, origLen, linkType: this.linkType, data };
  }

  private nextPcapng(): RawPacket | null | false {
    if (this.avail() < 12) return false;
    const typeBe = this.view(this.pos, 4).getUint32(0, false);
    if (typeBe === 0x0a0d0d0a) {
      // Section header: byte-order magic decides endianness for the whole section.
      const magic = this.view(this.pos + 8, 4).getUint32(0, false);
      if (magic === 0x1a2b3c4d) this.le = false;
      else if (magic === 0x4d3c2b1a) this.le = true;
      else throw new Error("Corrupt pcapng section header.");
      this.ifaces = [];
    }
    const head = this.view(this.pos, 8);
    const type = head.getUint32(0, this.le);
    const total = head.getUint32(4, this.le);
    if (total < 12 || total > 0x4000000) throw new Error("Corrupt pcapng block.");
    if (this.avail() < total) return false;
    const b = this.pos;
    const v = this.view(b, total);
    this.pos += total;

    if (type === 0x00000001) {
      const linkType = v.getUint16(8, this.le);
      let tsDiv = 1e6;
      let o = 16;
      while (o + 4 <= total - 4) {
        const code = v.getUint16(o, this.le);
        const len = v.getUint16(o + 2, this.le);
        if (code === 0) break;
        if (code === 9 && len >= 1) {
          const r = v.getUint8(o + 4);
          tsDiv = r & 0x80 ? Math.pow(2, r & 0x7f) : Math.pow(10, r);
        }
        o += 4 + ((len + 3) & ~3);
      }
      this.ifaces.push({ linkType, tsDiv });
      return null;
    }
    if (type === 0x00000006 || type === 0x00000002) {
      const ifaceId = type === 6 ? v.getUint32(8, this.le) : v.getUint16(8, this.le);
      const iface = this.ifaces[ifaceId] ?? { linkType: 1, tsDiv: 1e6 };
      const hi = v.getUint32(12, this.le);
      const lo = v.getUint32(16, this.le);
      const capLen = v.getUint32(20, this.le);
      const origLen = v.getUint32(24, this.le);
      const safeCap = Math.min(capLen, total - 32);
      const data = this.buf.slice(b + 28, b + 28 + safeCap);
      return {
        ts: (hi * 4294967296 + lo) / iface.tsDiv,
        capLen: safeCap,
        origLen,
        linkType: iface.linkType,
        data,
      };
    }
    if (type === 0x00000003) {
      const iface = this.ifaces[0] ?? { linkType: 1, tsDiv: 1e6 };
      const origLen = v.getUint32(8, this.le);
      const capLen = Math.min(origLen, total - 16);
      const data = this.buf.slice(b + 12, b + 12 + capLen);
      return { ts: 0, capLen, origLen, linkType: iface.linkType, data };
    }
    return null;
  }
}

export function parseCapture(bytes: Uint8Array): RawPacket[] {
  return new CaptureParser().push(bytes);
}
