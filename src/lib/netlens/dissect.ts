import type { FieldValue, Packet, ProtoKey, RawPacket, StreamRef, TreeNode } from "./types";
import { hex, ipv4Str, ipv6Str, macStr } from "./format";

interface Ctx {
  d: Uint8Array;
  v: DataView;
  tree: TreeNode[] | null;
  fields: Map<string, FieldValue[]>;
  layers: string[];
  src: string;
  dst: string;
  netSrc: string;
  netDst: string;
  protocol: string;
  info: string;
  proto: ProtoKey;
  ttl: number;
  payload: Packet["payload"];
  stream: StreamRef | null;
  tcpRel: Packet["tcpRel"];
  prior: Packet | null;
  session: Dissector | null;
}

type Parent = TreeNode | null;

function node(ctx: Ctx, parent: Parent, label: string, start: number, length: number): TreeNode | null {
  if (!ctx.tree) return null;
  const n: TreeNode = { label, start, length, children: [], field: null, value: null };
  (parent ? parent.children : ctx.tree).push(n);
  return n;
}

function field(
  ctx: Ctx,
  parent: Parent,
  key: string,
  value: FieldValue,
  label: string,
  start: number,
  length: number,
): TreeNode | null {
  addField(ctx, key, value);
  const n = node(ctx, parent, label, start, length);
  if (n) {
    n.field = key;
    n.value = value;
  }
  return n;
}

function addField(ctx: Ctx, key: string, value: FieldValue) {
  const arr = ctx.fields.get(key);
  if (arr) arr.push(value);
  else ctx.fields.set(key, [value]);
}

function layer(ctx: Ctx, name: string, label: string, start: number, length: number): TreeNode | null {
  ctx.layers.push(name);
  addField(ctx, name, 1);
  const n = node(ctx, null, label, start, length);
  if (n) {
    n.field = name;
    n.value = 1;
  }
  return n;
}

function setTop(ctx: Ctx, protocol: string, proto: ProtoKey, info: string) {
  ctx.protocol = protocol;
  ctx.proto = proto;
  ctx.info = info;
}

const ETHERTYPE_NAMES: Record<number, string> = {
  0x0800: "IPv4",
  0x86dd: "IPv6",
  0x0806: "ARP",
  0x8100: "802.1Q VLAN",
  0x88cc: "LLDP",
  0x888e: "EAPOL",
};

const IP_PROTOS: Record<number, string> = {
  1: "ICMP",
  2: "IGMP",
  6: "TCP",
  17: "UDP",
  41: "IPv6",
  47: "GRE",
  50: "ESP",
  58: "ICMPv6",
  89: "OSPF",
  132: "SCTP",
};

const WELL_KNOWN_PORTS: Record<number, string> = {
  20: "ftp-data",
  21: "ftp",
  22: "ssh",
  23: "telnet",
  25: "smtp",
  53: "domain",
  67: "bootps",
  68: "bootpc",
  80: "http",
  110: "pop3",
  123: "ntp",
  143: "imap",
  443: "https",
  445: "microsoft-ds",
  993: "imaps",
  1900: "ssdp",
  3306: "mysql",
  5353: "mdns",
  5432: "postgresql",
  8080: "http-alt",
};

/** Stateful dissector: keeps per-capture session state (streams, relative sequence numbers). */
export class Dissector {
  private first: number | null = null;
  private prev: number | null = null;
  private count = 0;
  streams = new Map<string, { index: number; client: string; isn: [number | null, number | null] }>();
  private nextStream = { tcp: 0, udp: 0 };

  dissect(raw: RawPacket): Packet {
    this.count++;
    if (this.first === null) this.first = raw.ts;
    const rel = raw.ts - this.first;
    const delta = this.prev === null ? 0 : raw.ts - this.prev;
    this.prev = raw.ts;
    const ctx = makeCtx(raw.data, false, null, this);
    runDissection(ctx, raw, this.count, rel);
    return {
      no: this.count,
      ts: raw.ts,
      rel,
      delta,
      len: raw.origLen,
      capLen: raw.capLen,
      linkType: raw.linkType,
      data: raw.data,
      src: ctx.src,
      dst: ctx.dst,
      protocol: ctx.protocol,
      info: ctx.info,
      proto: ctx.proto,
      layers: ctx.layers,
      fields: ctx.fields,
      stream: ctx.stream,
      payload: ctx.payload,
      tcpRel: ctx.tcpRel,
      netSrc: ctx.netSrc,
      netDst: ctx.netDst,
    };
  }

  /** Resolve (or allocate) a stream id for a 4-tuple. */
  stream(kind: "tcp" | "udp", a: string, b: string) {
    const key = `${kind}|${a < b ? a + "|" + b : b + "|" + a}`;
    let s = this.streams.get(key);
    if (!s) {
      s = { index: this.nextStream[kind]++, client: a, isn: [null, null] };
      this.streams.set(key, s);
    }
    return s;
  }
}

function makeCtx(d: Uint8Array, withTree: boolean, prior: Packet | null, session: Dissector | null): Ctx {
  return {
    d,
    v: new DataView(d.buffer, d.byteOffset, d.byteLength),
    tree: withTree ? [] : null,
    fields: new Map(),
    layers: [],
    src: "",
    dst: "",
    netSrc: "",
    netDst: "",
    protocol: "Frame",
    info: "",
    proto: "other",
    ttl: 0,
    payload: null,
    stream: prior?.stream ?? null,
    tcpRel: prior?.tcpRel ?? null,
    prior,
    session,
  };
}

/** Re-dissects a packet to build its full detail tree (done lazily on selection). */
export function buildTree(p: Packet): TreeNode[] {
  const ctx = makeCtx(p.data, true, p, null);
  runDissection(ctx, { ts: p.ts, capLen: p.capLen, origLen: p.len, linkType: p.linkType, data: p.data }, p.no, p.rel);
  return ctx.tree ?? [];
}

function runDissection(ctx: Ctx, raw: RawPacket, no: number, rel: number) {
  const fr = layer(
    ctx,
    "frame",
    `Frame ${no}: ${raw.origLen} bytes on wire (${raw.origLen * 8} bits), ${raw.capLen} bytes captured`,
    0,
    raw.capLen,
  );
  const date = new Date(raw.ts * 1000);
  node(ctx, fr, `Arrival Time: ${isNaN(date.getTime()) ? "unknown" : date.toISOString()}`, 0, 0);
  field(ctx, fr, "frame.number", no, `Frame Number: ${no}`, 0, 0);
  field(ctx, fr, "frame.time_relative", Number(rel.toFixed(6)), `Time since first frame: ${rel.toFixed(6)} seconds`, 0, 0);
  field(ctx, fr, "frame.len", raw.origLen, `Frame Length: ${raw.origLen} bytes`, 0, 0);
  field(ctx, fr, "frame.cap_len", raw.capLen, `Capture Length: ${raw.capLen} bytes`, 0, 0);
  try {
    switch (raw.linkType) {
      case 1:
        ethernet(ctx, 0);
        break;
      case 0:
      case 108:
        loopback(ctx, raw.linkType);
        break;
      case 12:
      case 14:
      case 101:
      case 228:
      case 229:
        rawIp(ctx, 0);
        break;
      case 113:
        sll(ctx);
        break;
      case 276:
        sll2(ctx);
        break;
      default:
        setTop(ctx, "Frame", "other", `Unsupported link type ${raw.linkType}`);
    }
  } catch {
    ctx.info = (ctx.info ? ctx.info + " " : "") + "[Malformed Packet]";
    ctx.proto = "alert";
    node(ctx, null, "[Malformed Packet: dissector ran past the end of the data]", 0, 0);
  }
  if (fr) {
    node(ctx, fr, `[Protocols in frame: ${ctx.layers.join(":")}]`, 0, 0);
  }
}

function ethernet(ctx: Ctx, o: number) {
  const { d, v } = ctx;
  if (d.length < o + 14) throw new RangeError("short");
  const dst = macStr(d, o);
  const src = macStr(d, o + 6);
  let type = v.getUint16(o + 12);
  const eth = layer(ctx, "eth", `Ethernet II, Src: ${src}, Dst: ${dst}`, o, 14);
  field(ctx, eth, "eth.dst", dst, `Destination: ${dst}`, o, 6);
  field(ctx, eth, "eth.src", src, `Source: ${src}`, o + 6, 6);
  addField(ctx, "eth.addr", dst);
  addField(ctx, "eth.addr", src);
  let next = o + 14;
  if (type === 0x8100) {
    const tci = v.getUint16(o + 14);
    const vlan = node(ctx, null, `802.1Q Virtual LAN, ID: ${tci & 0xfff}`, o + 12, 4);
    field(ctx, vlan, "vlan.id", tci & 0xfff, `ID: ${tci & 0xfff}`, o + 14, 2);
    type = v.getUint16(o + 16);
    next = o + 18;
  }
  field(ctx, eth, "eth.type", type, `Type: ${ETHERTYPE_NAMES[type] ?? "Unknown"} (${hex(type)})`, next - 2, 2);
  ctx.src = src;
  ctx.dst = dst;
  ctx.netSrc = src;
  ctx.netDst = dst;
  setTop(ctx, "Ethernet", "other", `Ethertype ${hex(type)}`);
  etherPayload(ctx, type, next);
}

function etherPayload(ctx: Ctx, type: number, o: number) {
  if (type === 0x0800) ipv4(ctx, o);
  else if (type === 0x86dd) ipv6(ctx, o);
  else if (type === 0x0806) arp(ctx, o);
  else if (type === 0x88cc) setTop(ctx, "LLDP", "other", "Link Layer Discovery Protocol");
  else if (type === 0x888e) setTop(ctx, "EAPOL", "other", "802.1X Authentication");
}

function loopback(ctx: Ctx, linkType: number) {
  const { d, v } = ctx;
  const le = linkType === 0 && (d[0] ?? 0) !== 0;
  const fam = v.getUint32(0, le);
  const nl = layer(ctx, "null", `Null/Loopback, Family: ${fam === 2 ? "IPv4" : "IPv6"}`, 0, 4);
  field(ctx, nl, "null.family", fam, `Family: ${fam}`, 0, 4);
  if (fam === 2) ipv4(ctx, 4);
  else if (fam === 24 || fam === 28 || fam === 30) ipv6(ctx, 4);
}

function rawIp(ctx: Ctx, o: number) {
  const ver = (ctx.d[o] ?? 0) >> 4;
  if (ver === 4) ipv4(ctx, o);
  else if (ver === 6) ipv6(ctx, o);
}

function sll(ctx: Ctx) {
  const { v } = ctx;
  const proto = v.getUint16(14);
  const l = layer(ctx, "sll", "Linux cooked capture v1", 0, 16);
  field(ctx, l, "sll.etype", proto, `Protocol: ${ETHERTYPE_NAMES[proto] ?? "Unknown"} (${hex(proto)})`, 14, 2);
  etherPayload(ctx, proto, 16);
}

function sll2(ctx: Ctx) {
  const { v } = ctx;
  const proto = v.getUint16(0);
  const l = layer(ctx, "sll", "Linux cooked capture v2", 0, 20);
  field(ctx, l, "sll.etype", proto, `Protocol: ${ETHERTYPE_NAMES[proto] ?? "Unknown"} (${hex(proto)})`, 0, 2);
  field(ctx, l, "sll.ifindex", v.getUint32(4), `Interface index: ${v.getUint32(4)}`, 4, 4);
  etherPayload(ctx, proto, 20);
}

function arp(ctx: Ctx, o: number) {
  const { d, v } = ctx;
  const op = v.getUint16(o + 6);
  const sha = macStr(d, o + 8);
  const spa = ipv4Str(d, o + 14);
  const tha = macStr(d, o + 18);
  const tpa = ipv4Str(d, o + 24);
  const opName = op === 1 ? "request" : op === 2 ? "reply" : `opcode ${op}`;
  const a = layer(ctx, "arp", `Address Resolution Protocol (${opName})`, o, 28);
  field(ctx, a, "arp.opcode", op, `Opcode: ${opName} (${op})`, o + 6, 2);
  field(ctx, a, "arp.src.hw_mac", sha, `Sender MAC address: ${sha}`, o + 8, 6);
  field(ctx, a, "arp.src.proto_ipv4", spa, `Sender IP address: ${spa}`, o + 14, 4);
  field(ctx, a, "arp.dst.hw_mac", tha, `Target MAC address: ${tha}`, o + 18, 6);
  field(ctx, a, "arp.dst.proto_ipv4", tpa, `Target IP address: ${tpa}`, o + 24, 4);
  const info = op === 1 ? `Who has ${tpa}? Tell ${spa}` : op === 2 ? `${spa} is at ${sha}` : `ARP ${opName}`;
  setTop(ctx, "ARP", "arp", info);
}

function ipv4(ctx: Ctx, o: number) {
  const { d, v } = ctx;
  const b0 = v.getUint8(o);
  const ihl = (b0 & 0x0f) * 4;
  const tos = v.getUint8(o + 1);
  const totalLen = v.getUint16(o + 2);
  const id = v.getUint16(o + 4);
  const ff = v.getUint16(o + 6);
  const ttl = v.getUint8(o + 8);
  const proto = v.getUint8(o + 9);
  const csum = v.getUint16(o + 10);
  const src = ipv4Str(d, o + 12);
  const dst = ipv4Str(d, o + 16);
  const ip = layer(ctx, "ip", `Internet Protocol Version 4, Src: ${src}, Dst: ${dst}`, o, ihl);
  field(ctx, ip, "ip.version", 4, `Version: 4`, o, 1);
  field(ctx, ip, "ip.hdr_len", ihl, `Header Length: ${ihl} bytes`, o, 1);
  field(ctx, ip, "ip.dsfield", tos, `Differentiated Services Field: ${hex(tos, 2)}`, o + 1, 1);
  field(ctx, ip, "ip.len", totalLen, `Total Length: ${totalLen}`, o + 2, 2);
  field(ctx, ip, "ip.id", id, `Identification: ${hex(id)} (${id})`, o + 4, 2);
  const flags = node(ctx, ip, `Flags: ${hex(ff >> 13, 2)}${ff & 0x4000 ? ", Don't fragment" : ""}${ff & 0x2000 ? ", More fragments" : ""}`, o + 6, 2);
  field(ctx, flags, "ip.flags.df", ff & 0x4000 ? 1 : 0, `Don't fragment: ${ff & 0x4000 ? "Set" : "Not set"}`, o + 6, 1);
  field(ctx, flags, "ip.flags.mf", ff & 0x2000 ? 1 : 0, `More fragments: ${ff & 0x2000 ? "Set" : "Not set"}`, o + 6, 1);
  const fragOff = (ff & 0x1fff) * 8;
  field(ctx, ip, "ip.frag_offset", fragOff, `Fragment Offset: ${fragOff}`, o + 6, 2);
  field(ctx, ip, "ip.ttl", ttl, `Time to Live: ${ttl}`, o + 8, 1);
  field(ctx, ip, "ip.proto", proto, `Protocol: ${IP_PROTOS[proto] ?? "Unknown"} (${proto})`, o + 9, 1);
  field(ctx, ip, "ip.checksum", csum, `Header Checksum: ${hex(csum)}`, o + 10, 2);
  field(ctx, ip, "ip.src", src, `Source Address: ${src}`, o + 12, 4);
  field(ctx, ip, "ip.dst", dst, `Destination Address: ${dst}`, o + 16, 4);
  addField(ctx, "ip.addr", src);
  addField(ctx, "ip.addr", dst);
  ctx.src = src;
  ctx.dst = dst;
  ctx.netSrc = src;
  ctx.netDst = dst;
  ctx.ttl = ttl;
  setTop(ctx, "IPv4", "other", `${IP_PROTOS[proto] ?? "Protocol " + proto}`);
  const end = Math.min(d.length, o + Math.max(totalLen, ihl));
  if (fragOff > 0) {
    ctx.info = `Fragmented IP protocol (proto=${IP_PROTOS[proto] ?? proto}, off=${fragOff}, ID=${hex(id)})`;
    return;
  }
  transport(ctx, proto, o + ihl, end, src, dst);
}

function ipv6(ctx: Ctx, o: number) {
  const { d, v } = ctx;
  const w = v.getUint32(o);
  const plen = v.getUint16(o + 4);
  let nxt = v.getUint8(o + 6);
  const hlim = v.getUint8(o + 7);
  const src = ipv6Str(d, o + 8);
  const dst = ipv6Str(d, o + 24);
  const ip = layer(ctx, "ipv6", `Internet Protocol Version 6, Src: ${src}, Dst: ${dst}`, o, 40);
  field(ctx, ip, "ipv6.version", 6, `Version: 6`, o, 1);
  field(ctx, ip, "ipv6.tclass", (w >>> 20) & 0xff, `Traffic Class: ${hex((w >>> 20) & 0xff, 2)}`, o, 2);
  field(ctx, ip, "ipv6.flow", w & 0xfffff, `Flow Label: ${hex(w & 0xfffff, 5)}`, o + 1, 3);
  field(ctx, ip, "ipv6.plen", plen, `Payload Length: ${plen}`, o + 4, 2);
  field(ctx, ip, "ipv6.nxt", nxt, `Next Header: ${IP_PROTOS[nxt] ?? "Unknown"} (${nxt})`, o + 6, 1);
  field(ctx, ip, "ipv6.hlim", hlim, `Hop Limit: ${hlim}`, o + 7, 1);
  field(ctx, ip, "ipv6.src", src, `Source Address: ${src}`, o + 8, 16);
  field(ctx, ip, "ipv6.dst", dst, `Destination Address: ${dst}`, o + 24, 16);
  addField(ctx, "ipv6.addr", src);
  addField(ctx, "ipv6.addr", dst);
  ctx.src = src;
  ctx.dst = dst;
  ctx.netSrc = src;
  ctx.netDst = dst;
  ctx.ttl = hlim;
  setTop(ctx, "IPv6", "other", `${IP_PROTOS[nxt] ?? "Next header " + nxt}`);
  let p = o + 40;
  const end = Math.min(d.length, o + 40 + plen);
  for (let guard = 0; guard < 8 && (nxt === 0 || nxt === 43 || nxt === 60 || nxt === 44); guard++) {
    const name = nxt === 0 ? "Hop-by-Hop Options" : nxt === 43 ? "Routing Header" : nxt === 60 ? "Destination Options" : "Fragment Header";
    const len = nxt === 44 ? 8 : (v.getUint8(p + 1) + 1) * 8;
    node(ctx, ip, `IPv6 ${name}`, p, len);
    nxt = v.getUint8(p);
    p += len;
  }
  transport(ctx, nxt, p, end, src, dst);
}

function transport(ctx: Ctx, proto: number, o: number, end: number, src: string, dst: string) {
  if (proto === 6) tcp(ctx, o, end, src, dst);
  else if (proto === 17) udp(ctx, o, end, src, dst);
  else if (proto === 1) icmp(ctx, o, end);
  else if (proto === 58) icmpv6(ctx, o, end);
  else if (proto === 2) {
    layer(ctx, "igmp", "Internet Group Management Protocol", o, end - o);
    setTop(ctx, "IGMP", "other", "Membership report / query");
  } else if (proto === 47) setTop(ctx, "GRE", "other", "Generic Routing Encapsulation");
  else if (proto === 50) setTop(ctx, "ESP", "other", "Encapsulating Security Payload");
}

function portLabel(p: number) {
  const n = WELL_KNOWN_PORTS[p];
  return n ? `${p} (${n})` : `${p}`;
}

const TCP_FLAG_NAMES: [number, string][] = [
  [0x80, "CWR"],
  [0x40, "ECE"],
  [0x20, "URG"],
  [0x10, "ACK"],
  [0x08, "PSH"],
  [0x04, "RST"],
  [0x02, "SYN"],
  [0x01, "FIN"],
];

function tcp(ctx: Ctx, o: number, end: number, ipSrc: string, ipDst: string) {
  const { v } = ctx;
  const sport = v.getUint16(o);
  const dport = v.getUint16(o + 2);
  const seqRaw = v.getUint32(o + 4);
  const ackRaw = v.getUint32(o + 8);
  const off = (v.getUint8(o + 12) >> 4) * 4;
  const flags = v.getUint16(o + 12) & 0x1ff;
  const win = v.getUint16(o + 14);
  const csum = v.getUint16(o + 16);
  const plen = Math.max(0, end - o - off);

  const a = `${ipSrc}:${sport}`;
  const b = `${ipDst}:${dport}`;
  let stream = ctx.stream;
  let rel = ctx.tcpRel;
  if (ctx.session) {
    const s = ctx.session.stream("tcp", a, b);
    // The side that sends the first SYN (without ACK) is the client.
    if (s.isn[0] === null && s.isn[1] === null && flags & 0x02 && flags & 0x10) s.client = b;
    const fromClient = s.client === a;
    const di = fromClient ? 0 : 1;
    if (s.isn[di] === null) s.isn[di] = flags & 0x02 ? seqRaw : seqRaw - 1 >>> 0;
    const isnSelf = s.isn[di] ?? seqRaw;
    const isnPeer = s.isn[1 - di];
    const relSeq = (seqRaw - isnSelf) >>> 0;
    const relAck = isnPeer === null || isnPeer === undefined ? ackRaw : (ackRaw - isnPeer) >>> 0;
    stream = { kind: "tcp", index: s.index, fromClient };
    rel = { seq: relSeq, ack: flags & 0x10 ? relAck : 0 };
    ctx.stream = stream;
    ctx.tcpRel = rel;
  }
  const seq = rel?.seq ?? seqRaw;
  const ack = rel?.ack ?? ackRaw;
  const flagNames = TCP_FLAG_NAMES.filter(([m]) => flags & m).map(([, n]) => n);

  const t = layer(ctx, "tcp", `Transmission Control Protocol, Src Port: ${sport}, Dst Port: ${dport}, Seq: ${seq}${flags & 0x10 ? `, Ack: ${ack}` : ""}, Len: ${plen}`, o, off);
  field(ctx, t, "tcp.srcport", sport, `Source Port: ${portLabel(sport)}`, o, 2);
  field(ctx, t, "tcp.dstport", dport, `Destination Port: ${portLabel(dport)}`, o + 2, 2);
  addField(ctx, "tcp.port", sport);
  addField(ctx, "tcp.port", dport);
  if (stream) field(ctx, t, "tcp.stream", stream.index, `[Stream index: ${stream.index}]`, o, 0);
  field(ctx, t, "tcp.len", plen, `[TCP Segment Len: ${plen}]`, o, 0);
  field(ctx, t, "tcp.seq", seq, `Sequence Number: ${seq}    (relative sequence number)`, o + 4, 4);
  field(ctx, t, "tcp.seq_raw", seqRaw, `Sequence Number (raw): ${seqRaw}`, o + 4, 4);
  field(ctx, t, "tcp.ack", ack, `Acknowledgment Number: ${ack}`, o + 8, 4);
  addField(ctx, "tcp.ack_raw", ackRaw);
  field(ctx, t, "tcp.hdr_len", off, `Header Length: ${off} bytes`, o + 12, 1);
  const fl = node(ctx, t, `Flags: ${hex(flags, 3)} (${flagNames.join(", ") || "none"})`, o + 12, 2);
  field(ctx, fl, "tcp.flags.syn", flags & 0x02 ? 1 : 0, `Syn: ${flags & 0x02 ? "Set" : "Not set"}`, o + 13, 1);
  field(ctx, fl, "tcp.flags.ack", flags & 0x10 ? 1 : 0, `Acknowledgment: ${flags & 0x10 ? "Set" : "Not set"}`, o + 13, 1);
  field(ctx, fl, "tcp.flags.push", flags & 0x08 ? 1 : 0, `Push: ${flags & 0x08 ? "Set" : "Not set"}`, o + 13, 1);
  field(ctx, fl, "tcp.flags.reset", flags & 0x04 ? 1 : 0, `Reset: ${flags & 0x04 ? "Set" : "Not set"}`, o + 13, 1);
  field(ctx, fl, "tcp.flags.fin", flags & 0x01 ? 1 : 0, `Fin: ${flags & 0x01 ? "Set" : "Not set"}`, o + 13, 1);
  field(ctx, t, "tcp.window_size", win, `Window: ${win}`, o + 14, 2);
  field(ctx, t, "tcp.checksum", csum, `Checksum: ${hex(csum)}`, o + 16, 2);
  if (off > 20) node(ctx, t, `Options: (${off - 20} bytes)`, o + 20, off - 20);
  if (plen > 0) node(ctx, t, `TCP payload (${plen} bytes)`, o + off, plen);

  const info = `${sport} → ${dport} [${flagNames.filter((n) => n !== "CWR" && n !== "ECE").join(", ")}] Seq=${seq}${flags & 0x10 ? ` Ack=${ack}` : ""} Win=${win} Len=${plen}`;
  setTop(ctx, "TCP", flags & 0x04 ? "alert" : "tcp", info);
  ctx.src = ipSrc;
  ctx.dst = ipDst;
  if (plen > 0) {
    ctx.payload = { offset: o + off, length: plen, seq };
    tcpApp(ctx, o + off, plen, sport, dport);
  }
}

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH", "CONNECT", "TRACE"];

function startsWithAscii(d: Uint8Array, o: number, s: string) {
  for (let i = 0; i < s.length; i++) if (d[o + i] !== s.charCodeAt(i)) return false;
  return true;
}

function tcpApp(ctx: Ctx, o: number, len: number, sport: number, dport: number) {
  const { d } = ctx;
  const isHttpStart =
    startsWithAscii(d, o, "HTTP/1.") || HTTP_METHODS.some((m) => startsWithAscii(d, o, m + " "));
  if (isHttpStart) return http(ctx, o, len);
  const b0 = d[o] ?? 0;
  const b1 = d[o + 1] ?? 0;
  if (b0 >= 20 && b0 <= 23 && b1 === 3) return tls(ctx, o, len);
  if (sport === 443 || dport === 443) {
    layer(ctx, "tls", "Transport Layer Security", o, len);
    setTop(ctx, "TLS", "tls", "Continuation Data");
    return;
  }
  if (sport === 53 || dport === 53) return dns(ctx, o + 2, len - 2, "DNS");
  if (sport === 22 || dport === 22) {
    layer(ctx, "ssh", "SSH Protocol", o, len);
    const text = new TextDecoder().decode(d.subarray(o, o + Math.min(len, 80)));
    setTop(ctx, "SSH", "tcp", text.startsWith("SSH-") ? `Protocol (${text.trim()})` : "Encrypted packet");
    return;
  }
}

function http(ctx: Ctx, o: number, len: number) {
  const { d } = ctx;
  const text = new TextDecoder("latin1").decode(d.subarray(o, o + len));
  const headEnd = text.indexOf("\r\n\r\n");
  const head = headEnd >= 0 ? text.slice(0, headEnd) : text;
  const lines = head.split("\r\n");
  const first = lines[0] ?? "";
  const h = layer(ctx, "http", "Hypertext Transfer Protocol", o, len);
  let off = o;
  let info = first;
  const firstNode = node(ctx, h, first, off, first.length + 2);
  if (first.startsWith("HTTP/")) {
    const [, code = "", ...phrase] = first.split(" ");
    field(ctx, firstNode, "http.response.code", Number(code), `Status Code: ${code}`, off + 9, 3);
    field(ctx, firstNode, "http.response.phrase", phrase.join(" "), `Response Phrase: ${phrase.join(" ")}`, off + 13, phrase.join(" ").length);
    addField(ctx, "http.response", 1);
  } else {
    const [method = "", uri = "", version = ""] = first.split(" ");
    field(ctx, firstNode, "http.request.method", method, `Request Method: ${method}`, off, method.length);
    field(ctx, firstNode, "http.request.uri", uri, `Request URI: ${uri}`, off + method.length + 1, uri.length);
    field(ctx, firstNode, "http.request.version", version, `Request Version: ${version}`, off + method.length + uri.length + 2, version.length);
    addField(ctx, "http.request", 1);
  }
  off += first.length + 2;
  let contentType = "";
  const headerMap: Record<string, string> = {
    host: "http.host",
    "user-agent": "http.user_agent",
    "content-type": "http.content_type",
    "content-length": "http.content_length",
    server: "http.server",
    cookie: "http.cookie",
    "set-cookie": "http.set_cookie",
    referer: "http.referer",
    location: "http.location",
    authorization: "http.authorization",
  };
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(":");
    const name = idx > 0 ? line.slice(0, idx).trim().toLowerCase() : "";
    const value = idx > 0 ? line.slice(idx + 1).trim() : line;
    const key = headerMap[name];
    if (key) field(ctx, h, key, key === "http.content_length" ? Number(value) : value, line, off, line.length + 2);
    else node(ctx, h, line, off, line.length + 2);
    if (name === "content-type") contentType = value.split(";")[0] ?? value;
    off += line.length + 2;
  }
  if (headEnd >= 0) {
    const bodyLen = len - (headEnd + 4);
    if (bodyLen > 0) node(ctx, h, `File Data: ${bodyLen} bytes${contentType ? ` (${contentType})` : ""}`, o + headEnd + 4, bodyLen);
  }
  if (first.startsWith("HTTP/") && contentType) info += `  (${contentType})`;
  setTop(ctx, "HTTP", "http", info);
}

const TLS_CONTENT: Record<number, string> = { 20: "Change Cipher Spec", 21: "Alert", 22: "Handshake", 23: "Application Data" };
const TLS_HS: Record<number, string> = {
  1: "Client Hello",
  2: "Server Hello",
  4: "New Session Ticket",
  8: "Encrypted Extensions",
  11: "Certificate",
  12: "Server Key Exchange",
  13: "Certificate Request",
  14: "Server Hello Done",
  15: "Certificate Verify",
  16: "Client Key Exchange",
  20: "Finished",
};
function tlsVersion(v: number) {
  return v === 0x0304 ? "TLS 1.3" : v === 0x0303 ? "TLS 1.2" : v === 0x0302 ? "TLS 1.1" : v === 0x0301 ? "TLS 1.0" : v === 0x0300 ? "SSL 3.0" : hex(v);
}

function tls(ctx: Ctx, o: number, len: number) {
  const { d, v } = ctx;
  const end = o + len;
  const t = layer(ctx, "tls", "Transport Layer Security", o, len);
  const infos: string[] = [];
  let label = "TLS";
  let p = o;
  while (p + 5 <= end) {
    const ct = d[p] ?? 0;
    if (ct < 20 || ct > 23 || d[p + 1] !== 3) break;
    const ver = v.getUint16(p + 1);
    const rlen = v.getUint16(p + 3);
    const rec = node(ctx, t, `${tlsVersion(ver)} Record Layer: ${TLS_CONTENT[ct]}`, p, Math.min(5 + rlen, end - p));
    field(ctx, rec, "tls.record.content_type", ct, `Content Type: ${TLS_CONTENT[ct]} (${ct})`, p, 1);
    field(ctx, rec, "tls.record.version", ver, `Version: ${tlsVersion(ver)} (${hex(ver)})`, p + 1, 2);
    field(ctx, rec, "tls.record.length", rlen, `Length: ${rlen}`, p + 3, 2);
    if (ct === 22 && p + 9 <= end) {
      const hs = d[p + 5] ?? 0;
      const name = TLS_HS[hs] ?? (ver >= 0x0303 && infos.length ? "Encrypted Handshake Message" : `Handshake type ${hs}`);
      const hsNode = node(ctx, rec, `Handshake Protocol: ${name}`, p + 5, Math.min(rlen, end - p - 5));
      field(ctx, hsNode, "tls.handshake.type", hs, `Handshake Type: ${name} (${hs})`, p + 5, 1);
      let extra = "";
      if (hs === 1 || hs === 2) {
        const r = helloExtensions(ctx, hsNode, p + 9, Math.min(end, p + 5 + rlen), hs === 1);
        if (r.sni) extra = ` (SNI=${r.sni})`;
        if (r.version) label = r.version === 0x0304 ? "TLSv1.3" : "TLSv1.2";
      }
      infos.push(name + extra);
    } else {
      infos.push(TLS_CONTENT[ct] ?? "Record");
    }
    p += 5 + rlen;
  }
  if (label === "TLS" && infos.length) {
    const ver = v.getUint16(o + 1);
    label = ver === 0x0303 ? "TLSv1.2" : ver === 0x0301 ? "TLSv1.0" : "TLS";
  }
  setTop(ctx, label === "TLS" ? "TLS" : label, "tls", infos.length ? [...new Set(infos)].join(", ") : "Continuation Data");
}

function helloExtensions(ctx: Ctx, parent: Parent, p: number, end: number, client: boolean) {
  const { d, v } = ctx;
  const result: { sni: string | null; version: number | null } = { sni: null, version: null };
  const ver = v.getUint16(p);
  field(ctx, parent, "tls.handshake.version", ver, `Version: ${tlsVersion(ver)} (${hex(ver)})`, p, 2);
  p += 2 + 32; // version + random
  const sidLen = d[p] ?? 0;
  p += 1 + sidLen;
  if (client) {
    const csLen = v.getUint16(p);
    node(ctx, parent, `Cipher Suites (${csLen / 2} suites)`, p, 2 + csLen);
    p += 2 + csLen;
    const cmLen = d[p] ?? 0;
    p += 1 + cmLen;
  } else {
    const cs = v.getUint16(p);
    field(ctx, parent, "tls.handshake.ciphersuite", cs, `Cipher Suite: ${hex(cs)}`, p, 2);
    p += 3;
  }
  if (p + 2 > end) return result;
  const extLen = v.getUint16(p);
  p += 2;
  const extEnd = Math.min(end, p + extLen);
  while (p + 4 <= extEnd) {
    const type = v.getUint16(p);
    const len = v.getUint16(p + 2);
    if (type === 0 && len > 5) {
      const nameLen = v.getUint16(p + 7);
      const name = new TextDecoder().decode(d.subarray(p + 9, p + 9 + nameLen));
      result.sni = name;
      field(ctx, parent, "tls.handshake.extensions_server_name", name, `Extension: server_name, Server Name: ${name}`, p, 4 + len);
    } else if (type === 43) {
      if (client) {
        const n = d[p + 4] ?? 0;
        for (let i = 0; i < n; i += 2) if (v.getUint16(p + 5 + i) === 0x0304) result.version = 0x0304;
      } else result.version = v.getUint16(p + 4);
      node(ctx, parent, `Extension: supported_versions${result.version ? ` (${tlsVersion(result.version)})` : ""}`, p, 4 + len);
    } else if (type === 16) {
      const alpn: string[] = [];
      let q = p + 6;
      while (q < p + 4 + len) {
        const l = d[q] ?? 0;
        alpn.push(new TextDecoder().decode(d.subarray(q + 1, q + 1 + l)));
        q += 1 + l;
      }
      for (const a of alpn) addField(ctx, "tls.handshake.extensions_alpn_str", a);
      node(ctx, parent, `Extension: ALPN (${alpn.join(", ")})`, p, 4 + len);
    } else {
      node(ctx, parent, `Extension: type ${type} (len=${len})`, p, 4 + len);
    }
    p += 4 + len;
  }
  return result;
}

function udp(ctx: Ctx, o: number, end: number, ipSrc: string, ipDst: string) {
  const { v } = ctx;
  const sport = v.getUint16(o);
  const dport = v.getUint16(o + 2);
  const ulen = v.getUint16(o + 4);
  const csum = v.getUint16(o + 6);
  const plen = Math.max(0, Math.min(end, o + ulen) - o - 8);
  let stream = ctx.stream;
  if (ctx.session) {
    const s = ctx.session.stream("udp", `${ipSrc}:${sport}`, `${ipDst}:${dport}`);
    stream = { kind: "udp", index: s.index, fromClient: s.client === `${ipSrc}:${sport}` };
    ctx.stream = stream;
  }
  const u = layer(ctx, "udp", `User Datagram Protocol, Src Port: ${sport}, Dst Port: ${dport}`, o, 8);
  field(ctx, u, "udp.srcport", sport, `Source Port: ${portLabel(sport)}`, o, 2);
  field(ctx, u, "udp.dstport", dport, `Destination Port: ${portLabel(dport)}`, o + 2, 2);
  addField(ctx, "udp.port", sport);
  addField(ctx, "udp.port", dport);
  field(ctx, u, "udp.length", ulen, `Length: ${ulen}`, o + 4, 2);
  field(ctx, u, "udp.checksum", csum, `Checksum: ${hex(csum)}`, o + 6, 2);
  if (stream) field(ctx, u, "udp.stream", stream.index, `[Stream index: ${stream.index}]`, o, 0);
  setTop(ctx, "UDP", "udp", `${sport} → ${dport} Len=${plen}`);
  ctx.src = ipSrc;
  ctx.dst = ipDst;
  if (plen <= 0) return;
  const p = o + 8;
  ctx.payload = { offset: p, length: plen, seq: 0 };
  const has = (port: number) => sport === port || dport === port;
  if (has(53)) dns(ctx, p, plen, "DNS");
  else if (has(5353)) dns(ctx, p, plen, "MDNS");
  else if (has(5355)) dns(ctx, p, plen, "LLMNR");
  else if (has(67) || has(68)) dhcp(ctx, p, plen);
  else if (has(123)) ntp(ctx, p, plen);
  else if (has(1900)) ssdp(ctx, p, plen);
  else if (has(443)) quic(ctx, p, plen);
}

const DNS_TYPES: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  41: "OPT",
  64: "SVCB",
  65: "HTTPS",
  255: "ANY",
};

function readName(d: Uint8Array, o: number, base: number): { name: string; next: number } {
  const labels: string[] = [];
  let p = o;
  let next = -1;
  for (let jumps = 0; jumps < 32; ) {
    const len = d[p];
    if (len === undefined) break;
    if (len === 0) {
      p++;
      break;
    }
    if ((len & 0xc0) === 0xc0) {
      const ptr = ((len & 0x3f) << 8) | (d[p + 1] ?? 0);
      if (next < 0) next = p + 2;
      p = base + ptr;
      jumps++;
      continue;
    }
    labels.push(new TextDecoder().decode(d.subarray(p + 1, p + 1 + len)));
    p += 1 + len;
  }
  return { name: labels.join(".") || "<Root>", next: next >= 0 ? next : p };
}

function dns(ctx: Ctx, o: number, len: number, label: string) {
  const { d, v } = ctx;
  if (len < 12) return;
  const id = v.getUint16(o);
  const flags = v.getUint16(o + 2);
  const qd = v.getUint16(o + 4);
  const an = v.getUint16(o + 6);
  const ns = v.getUint16(o + 8);
  const ar = v.getUint16(o + 10);
  const isResp = (flags & 0x8000) !== 0;
  const rcode = flags & 0xf;
  const n = layer(ctx, "dns", `Domain Name System (${isResp ? "response" : "query"})`, o, len);
  if (label === "MDNS") addField(ctx, "mdns", 1);
  field(ctx, n, "dns.id", id, `Transaction ID: ${hex(id)}`, o, 2);
  const fl = node(ctx, n, `Flags: ${hex(flags)} ${isResp ? "Standard query response" : "Standard query"}${rcode ? `, rcode ${rcode}` : ", No error"}`, o + 2, 2);
  field(ctx, fl, "dns.flags.response", isResp ? 1 : 0, `Response: Message is a ${isResp ? "response" : "query"}`, o + 2, 2);
  field(ctx, fl, "dns.flags.rcode", rcode, `Reply code: ${rcode === 0 ? "No error" : rcode === 3 ? "No such name" : rcode} (${rcode})`, o + 3, 1);
  field(ctx, n, "dns.count.queries", qd, `Questions: ${qd}`, o + 4, 2);
  field(ctx, n, "dns.count.answers", an, `Answer RRs: ${an}`, o + 6, 2);
  node(ctx, n, `Authority RRs: ${ns}`, o + 8, 2);
  node(ctx, n, `Additional RRs: ${ar}`, o + 10, 2);
  let p = o + 12;
  const qs: string[] = [];
  const qNode = qd ? node(ctx, n, "Queries", p, 0) : null;
  for (let i = 0; i < qd && p < o + len; i++) {
    const { name, next } = readName(d, p, o);
    const type = v.getUint16(next);
    const tname = DNS_TYPES[type] ?? `TYPE${type}`;
    const q = node(ctx, qNode, `${name}: type ${tname}, class IN`, p, next + 4 - p);
    field(ctx, q, "dns.qry.name", name, `Name: ${name}`, p, next - p);
    field(ctx, q, "dns.qry.type", type, `Type: ${tname} (${type})`, next, 2);
    qs.push(`${tname} ${name}`);
    p = next + 4;
  }
  if (qNode) qNode.length = p - qNode.start;
  const answers: string[] = [];
  const aNode = an ? node(ctx, n, "Answers", p, 0) : null;
  for (let i = 0; i < an && p < o + len; i++) {
    const { name, next } = readName(d, p, o);
    const type = v.getUint16(next);
    const ttl = v.getUint32(next + 4);
    const rdlen = v.getUint16(next + 8);
    const rd = next + 10;
    const tname = DNS_TYPES[type] ?? `TYPE${type}`;
    let value = "";
    if (type === 1 && rdlen === 4) {
      value = ipv4Str(d, rd);
      addField(ctx, "dns.a", value);
    } else if (type === 28 && rdlen === 16) {
      value = ipv6Str(d, rd);
      addField(ctx, "dns.aaaa", value);
    } else if (type === 5 || type === 12 || type === 2) {
      value = readName(d, rd, o).name;
      addField(ctx, type === 5 ? "dns.cname" : type === 12 ? "dns.ptr.domain_name" : "dns.ns", value);
    } else if (type === 15) value = readName(d, rd + 2, o).name;
    else if (type === 16) value = new TextDecoder().decode(d.subarray(rd + 1, rd + rdlen));
    const ans = node(ctx, aNode, `${name}: type ${tname}, class IN${value ? `, ${tname === "CNAME" ? "cname" : "addr"} ${value}` : ""}`, p, rd + rdlen - p);
    field(ctx, ans, "dns.resp.name", name, `Name: ${name}`, p, next - p);
    field(ctx, ans, "dns.resp.type", type, `Type: ${tname} (${type})`, next, 2);
    field(ctx, ans, "dns.resp.ttl", ttl, `Time to live: ${ttl} seconds`, next + 4, 4);
    if (value) node(ctx, ans, `Data: ${value}`, rd, rdlen);
    answers.push(`${tname} ${value || "…"}`);
    p = rd + rdlen;
  }
  if (aNode) aNode.length = p - aNode.start;
  let info = `${isResp ? "Standard query response" : "Standard query"} ${hex(id)} ${qs.join(", ")}`;
  if (isResp && rcode === 3) info += " No such name";
  if (answers.length) info += " " + answers.slice(0, 4).join(" ") + (answers.length > 4 ? " …" : "");
  setTop(ctx, label, "dns", info);
}

const DHCP_TYPES: Record<number, string> = { 1: "Discover", 2: "Offer", 3: "Request", 4: "Decline", 5: "ACK", 6: "NAK", 7: "Release", 8: "Inform" };

function dhcp(ctx: Ctx, o: number, len: number) {
  const { d, v } = ctx;
  if (len < 240) return;
  const op = d[o] ?? 0;
  const xid = v.getUint32(o + 4);
  const n = layer(ctx, "dhcp", `Dynamic Host Configuration Protocol`, o, len);
  field(ctx, n, "dhcp.type", op, `Message type: ${op === 1 ? "Boot Request" : "Boot Reply"} (${op})`, o, 1);
  field(ctx, n, "dhcp.id", xid, `Transaction ID: ${hex(xid, 8)}`, o + 4, 4);
  field(ctx, n, "dhcp.ip.your", ipv4Str(d, o + 16), `Your (client) IP address: ${ipv4Str(d, o + 16)}`, o + 16, 4);
  field(ctx, n, "dhcp.hw.mac_addr", macStr(d, o + 28), `Client MAC address: ${macStr(d, o + 28)}`, o + 28, 6);
  let msgType = "";
  let p = o + 240;
  while (p < o + len) {
    const code = d[p] ?? 255;
    if (code === 255) break;
    if (code === 0) {
      p++;
      continue;
    }
    const l = d[p + 1] ?? 0;
    if (code === 53) {
      msgType = DHCP_TYPES[d[p + 2] ?? 0] ?? "Unknown";
      field(ctx, n, "dhcp.option.dhcp", d[p + 2] ?? 0, `Option: (53) DHCP Message Type (${msgType})`, p, 2 + l);
    } else if (code === 12) {
      const host = new TextDecoder().decode(d.subarray(p + 2, p + 2 + l));
      field(ctx, n, "dhcp.option.hostname", host, `Option: (12) Host Name: ${host}`, p, 2 + l);
    } else node(ctx, n, `Option: (${code}) length ${l}`, p, 2 + l);
    p += 2 + l;
  }
  setTop(ctx, "DHCP", "dhcp", `DHCP ${msgType || "Message"} - Transaction ID ${hex(xid, 8)}`);
}

function ntp(ctx: Ctx, o: number, len: number) {
  const b = ctx.d[o] ?? 0;
  const ver = (b >> 3) & 7;
  const mode = b & 7;
  const modes = ["reserved", "symmetric active", "symmetric passive", "client", "server", "broadcast", "control", "private"];
  const n = layer(ctx, "ntp", "Network Time Protocol", o, len);
  field(ctx, n, "ntp.mode", mode, `Mode: ${modes[mode]} (${mode})`, o, 1);
  setTop(ctx, "NTP", "udp", `NTP Version ${ver}, ${modes[mode]}`);
}

function ssdp(ctx: Ctx, o: number, len: number) {
  const text = new TextDecoder("latin1").decode(ctx.d.subarray(o, o + len));
  const first = text.split("\r\n")[0] ?? "";
  layer(ctx, "ssdp", "Simple Service Discovery Protocol", o, len);
  setTop(ctx, "SSDP", "udp", first);
}

function quic(ctx: Ctx, o: number, len: number) {
  const { d, v } = ctx;
  const b0 = d[o] ?? 0;
  const q = layer(ctx, "quic", "QUIC IETF", o, len);
  if (b0 & 0x80 && len >= 6) {
    const version = v.getUint32(o + 1);
    const types = ["Initial", "0-RTT", "Handshake", "Retry"];
    const type = version === 0x6b3343cf ? ["Retry", "Initial", "0-RTT", "Handshake"][(b0 >> 4) & 3] : types[(b0 >> 4) & 3];
    const dcidLen = d[o + 5] ?? 0;
    const dcid = Array.from(d.subarray(o + 6, o + 6 + dcidLen), (x) => x.toString(16).padStart(2, "0")).join("");
    field(ctx, q, "quic.long.packet_type", (b0 >> 4) & 3, `Packet Type: ${type}`, o, 1);
    field(ctx, q, "quic.version", version, `Version: ${hex(version, 8)}`, o + 1, 4);
    field(ctx, q, "quic.dcid", dcid, `Destination Connection ID: ${dcid}`, o + 6, dcidLen);
    setTop(ctx, "QUIC", "quic", `${type}, DCID=${dcid.slice(0, 16)}`);
  } else {
    node(ctx, q, "Short Header (1-RTT protected payload)", o, 1);
    setTop(ctx, "QUIC", "quic", "Protected Payload (KP0)");
  }
}

const ICMP_TYPES: Record<number, string> = {
  0: "Echo (ping) reply",
  3: "Destination unreachable",
  5: "Redirect",
  8: "Echo (ping) request",
  11: "Time-to-live exceeded",
};

function icmp(ctx: Ctx, o: number, end: number) {
  const { v } = ctx;
  const type = v.getUint8(o);
  const code = v.getUint8(o + 1);
  const n = layer(ctx, "icmp", "Internet Control Message Protocol", o, end - o);
  const name = ICMP_TYPES[type] ?? `Type ${type}`;
  field(ctx, n, "icmp.type", type, `Type: ${type} (${name})`, o, 1);
  field(ctx, n, "icmp.code", code, `Code: ${code}`, o + 1, 1);
  field(ctx, n, "icmp.checksum", v.getUint16(o + 2), `Checksum: ${hex(v.getUint16(o + 2))}`, o + 2, 2);
  let info = name;
  if (type === 0 || type === 8) {
    const id = v.getUint16(o + 4);
    const seq = v.getUint16(o + 6);
    field(ctx, n, "icmp.ident", id, `Identifier: ${id} (${hex(id)})`, o + 4, 2);
    field(ctx, n, "icmp.seq", seq, `Sequence Number: ${seq}`, o + 6, 2);
    if (end - o > 8) node(ctx, n, `Data (${end - o - 8} bytes)`, o + 8, end - o - 8);
    info += `  id=${hex(id)}, seq=${seq}, ttl=${ctx.ttl}`;
  }
  setTop(ctx, "ICMP", type === 3 || type === 11 ? "alert" : "icmp", info);
}

const ICMP6_TYPES: Record<number, string> = {
  1: "Destination Unreachable",
  3: "Time Exceeded",
  128: "Echo (ping) request",
  129: "Echo (ping) reply",
  133: "Router Solicitation",
  134: "Router Advertisement",
  135: "Neighbor Solicitation",
  136: "Neighbor Advertisement",
  143: "Multicast Listener Report Message v2",
};

function icmpv6(ctx: Ctx, o: number, end: number) {
  const { d, v } = ctx;
  const type = v.getUint8(o);
  const code = v.getUint8(o + 1);
  const name = ICMP6_TYPES[type] ?? `Type ${type}`;
  const n = layer(ctx, "icmpv6", "Internet Control Message Protocol v6", o, end - o);
  field(ctx, n, "icmpv6.type", type, `Type: ${name} (${type})`, o, 1);
  field(ctx, n, "icmpv6.code", code, `Code: ${code}`, o + 1, 1);
  let info = name;
  if ((type === 135 || type === 136) && end - o >= 24) {
    const target = ipv6Str(d, o + 8);
    field(ctx, n, "icmpv6.nd.ns.target_address", target, `Target Address: ${target}`, o + 8, 16);
    info += type === 135 ? ` for ${target}` : ` ${target}`;
  } else if (type === 128 || type === 129) {
    info += ` id=${hex(v.getUint16(o + 4))}, seq=${v.getUint16(o + 6)}`;
  }
  setTop(ctx, "ICMPv6", type < 128 ? "alert" : "icmp", info);
}
