import type { Packet } from "./types";

export type Direction = "to-site" | "from-site" | "local" | "unknown";
export interface PacketStory {
  direction: Direction;
  summary: string;
  srcIp: string;
  dstIp: string;
  srcRole: string;
  dstRole: string;
  website: string | null;
  websiteSource: string | null;
}

const first = (p: Packet, k: string) => { const v = p.fields.get(k)?.[0]; return v === undefined ? null : String(v); };

/** True for addresses that never leave a home/office network. */
export function isLocalAddress(a: string): boolean {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(a)) {
    const [x = 0, y = 0] = a.split(".").map(Number);
    return x === 10 || x === 127 || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || (x === 169 && y === 254) || x >= 224 || a === "0.0.0.0";
  }
  const l = a.toLowerCase();
  if (l.includes(":") && !/^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/.test(l)) return l === "::1" || l === "::" || l.startsWith("fe80") || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("ff");
  return true; // MAC or unknown: local link
}

/** Name lookups built from the capture itself. */
export type NameIndex = { byIp: Map<string, string>; byStream: Map<string, string> };

/** Builds name lookups from the capture itself only (DNS answers, TLS SNI, HTTP Host) — nothing leaves the device. */
export function buildNameIndex(packets: Packet[]): NameIndex {
  const byIp = new Map<string, string>();
  const byStream = new Map<string, string>();
  for (const p of packets) {
    const name = first(p, "dns.qry.name") ?? first(p, "dns.resp.name");
    if (name) for (const k of ["dns.a", "dns.aaaa"]) for (const ip of p.fields.get(k) ?? []) if (!byIp.has(String(ip))) byIp.set(String(ip), name);
    const host = first(p, "tls.handshake.extensions_server_name") ?? first(p, "http.host");
    if (host && p.stream) { const key = `${p.stream.kind}:${p.stream.index}`; if (!byStream.has(key)) byStream.set(key, host); }
  }
  return { byIp, byStream };
}

export function describePacket(p: Packet, index: ReturnType<typeof buildNameIndex>): PacketStory {
  const srcIp = p.netSrc, dstIp = p.netDst;
  const srcLocal = isLocalAddress(srcIp), dstLocal = isLocalAddress(dstIp);
  let website: string | null = null, websiteSource: string | null = null;
  const own = first(p, "tls.handshake.extensions_server_name") ?? first(p, "http.host");
  const dnsName = first(p, "dns.qry.name");
  if (own) { website = own; websiteSource = "named in this packet"; }
  else if (p.stream && index.byStream.has(`${p.stream.kind}:${p.stream.index}`)) { website = index.byStream.get(`${p.stream.kind}:${p.stream.index}`) ?? null; websiteSource = "named earlier in this conversation"; }
  else if (dnsName) { website = dnsName; websiteSource = "the name being looked up"; }
  else { const n = index.byIp.get(srcLocal ? dstIp : srcIp) ?? index.byIp.get(dstIp) ?? index.byIp.get(srcIp); if (n) { website = n; websiteSource = "matched from a DNS answer in this capture"; } }

  let direction: Direction = "unknown";
  if (srcLocal && !dstLocal) direction = "to-site";
  else if (!srcLocal && dstLocal) direction = "from-site";
  else if (p.stream) direction = p.stream.fromClient ? "to-site" : "from-site";
  else if (srcLocal && dstLocal) direction = "local";
  const site = website ?? "the other side";
  const summary = dnsName && !own
    ? `${first(p, "dns.flags.response") === "1" ? "A reply about" : "A question asking where to find"} ${dnsName}.`
    : direction === "to-site" ? `Your device sent this to ${site}.`
    : direction === "from-site" ? `${website ?? "The other side"} sent this back to your device.`
    : direction === "local" ? "This stayed inside your local network." : "Direction could not be worked out.";
  const role = (ip: string, local: boolean, isSrc: boolean) => local ? "Local network device" : (website && (isSrc ? direction === "from-site" : direction === "to-site") ? `Server for ${website}` : "Internet address");
  return { direction, summary, srcIp, dstIp, srcRole: role(srcIp, srcLocal, true), dstRole: role(dstIp, dstLocal, false), website, websiteSource };
}
