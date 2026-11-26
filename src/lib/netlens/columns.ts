import type { Packet } from "./types";
import { filterClause } from "./filter";
import type { NameIndex } from "./packet-story";

/** A readable description of one row, plus the filter behind it. */
export interface RowLabel {
  text: string;
  filter: string;
  kind: "dns" | "tls" | "http" | "tcp" | "udp" | "arp" | "icmp" | "other";
}

const num = (p: Packet, key: string) => Number(p.fields.get(key)?.[0] ?? 0);
const text = (p: Packet, key: string) => {
  const v = p.fields.get(key)?.[0];
  return v === undefined ? "" : String(v);
};
const isIPv4 = (a: string) => /^\d+\.\d+\.\d+\.\d+$/.test(a);

/**
 * Turns one packet into a plain-language row label. Every label carries the
 * display filter it was built from, so clicking the friendly text does exactly
 * what filtering on the raw field would do.
 */
export function describeRow(p: Packet, index: NameIndex): RowLabel {
  const name = text(p, "dns.qry.name") || text(p, "dns.resp.name");
  if (p.layers.includes("dns") && name) {
    const response = num(p, "dns.flags.response") === 1;
    return {
      text: response ? `Reply about ${name}` : `Asking where ${name} lives`,
      filter: filterClause("dns.qry.name", name),
      kind: "dns",
    };
  }
  if (p.layers.includes("dns")) return { text: "Name lookup", filter: "dns", kind: "dns" };

  if (num(p, "http.request") === 1) {
    const method = text(p, "http.request.method") || "Request";
    const uri = text(p, "http.request.uri") || "/";
    const host = text(p, "http.host");
    return {
      text: `${method} ${uri}${host ? ` · ${host}` : ""}`,
      filter: host ? filterClause("http.host", host) : "http",
      kind: "http",
    };
  }
  if (num(p, "http.response") === 1) {
    const code = text(p, "http.response.code");
    const phrase = text(p, "http.response.phrase");
    return {
      text: `Web reply ${code}${phrase ? ` ${phrase}` : ""}`,
      filter: code ? `http.response.code == ${code}` : "http",
      kind: "http",
    };
  }

  const sni = text(p, "tls.handshake.extensions_server_name");
  if (p.layers.includes("tls")) {
    if (sni && num(p, "tls.handshake.type") === 1) {
      return {
        text: `Hello to ${sni}, asking for a secure session`,
        filter: filterClause("tls.handshake.extensions_server_name", sni),
        kind: "tls",
      };
    }
    if (sni) {
      return {
        text: `Encrypted traffic with ${sni}`,
        filter: filterClause("tls.handshake.extensions_server_name", sni),
        kind: "tls",
      };
    }
    return { text: "Encrypted traffic", filter: "tls", kind: "tls" };
  }

  if (p.layers.includes("arp")) {
    const op = num(p, "arp.opcode");
    const target = text(p, "arp.dst.proto_ipv4");
    const sender = text(p, "arp.src.proto_ipv4");
    return {
      text: op === 1 ? `Who has ${target}?` : `${sender} answered: it is here`,
      filter: "arp",
      kind: "arp",
    };
  }

  if (p.layers.includes("icmp") || p.layers.includes("icmpv6")) {
    const type = num(p, "icmp.type") || num(p, "icmpv6.type");
    const field = p.layers.includes("icmpv6") ? "icmpv6" : "icmp";
    if (type === 8) return { text: `Ping to ${p.dst}`, filter: field, kind: "icmp" };
    if (type === 0) return { text: `Ping reply from ${p.src}`, filter: field, kind: "icmp" };
    return { text: `Ping message type ${type}`, filter: field, kind: "icmp" };
  }

  if (p.layers.includes("tcp")) {
    const syn = num(p, "tcp.flags.syn") === 1;
    const ack = num(p, "tcp.flags.ack") === 1;
    const dport = text(p, "tcp.dstport");
    const streamFilter = p.stream ? `${p.stream.kind}.stream == ${p.stream.index}` : "tcp";
    if (syn && !ack) {
      return {
        text: `Opening a connection to ${p.dst}${dport ? `:${dport}` : ""}`,
        filter: "tcp.flags.syn and not tcp.flags.ack",
        kind: "tcp",
      };
    }
    if (syn && ack) {
      return {
        text: `${p.src} accepted the connection`,
        filter: "tcp.flags.syn and tcp.flags.ack",
        kind: "tcp",
      };
    }
    if (num(p, "tcp.flags.reset") === 1) {
      return { text: "Connection cut short by a reset", filter: "tcp.flags.reset", kind: "tcp" };
    }
    if (num(p, "tcp.flags.fin") === 1) {
      return { text: "Closing the connection", filter: "tcp.flags.fin", kind: "tcp" };
    }
    if ((p.payload?.length ?? 0) > 0) {
      return {
        text: `Data sent to ${p.dst}${dport ? `:${dport}` : ""}`,
        filter: streamFilter,
        kind: "tcp",
      };
    }
    return { text: "Confirmation sent back", filter: streamFilter, kind: "tcp" };
  }

  if (p.layers.includes("udp")) {
    const dport = text(p, "udp.dstport");
    return {
      text: `Message to ${p.dst}${dport ? `:${dport}` : ""}`,
      filter: dport ? `udp.dstport == ${dport}` : "udp",
      kind: "udp",
    };
  }

  const website = index.byIp.get(isIPv4(p.dst) ? p.dst : p.src) ?? null;
  if (website) {
    return {
      text: `Traffic for ${website}`,
      filter: isIPv4(p.dst) ? `ip.addr == ${p.dst}` : "frame",
      kind: "other",
    };
  }
  return {
    text: `Data to ${p.dst}`,
    filter: isIPv4(p.dst) ? `ip.addr == ${p.dst}` : "frame",
    kind: "other",
  };
}

/** The raw filter clause a row label came from, for "show raw fields" mode. */
export function rawRowLabel(label: RowLabel): string {
  return label.filter;
}
