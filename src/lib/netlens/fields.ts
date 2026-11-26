export type FieldType = "proto" | "num" | "str" | "ip" | "mac" | "bool";

export interface FieldDef {
  name: string;
  type: FieldType;
  desc: string;
}

const f = (name: string, type: FieldType, desc: string): FieldDef => ({ name, type, desc });

export const FIELD_DEFS: FieldDef[] = [
  f("frame", "proto", "Any frame"),
  f("frame.number", "num", "Frame number"),
  f("frame.len", "num", "Frame length on the wire"),
  f("frame.cap_len", "num", "Captured length"),
  f("frame.time_relative", "num", "Seconds since first frame"),
  f("eth", "proto", "Ethernet"),
  f("eth.src", "mac", "Source MAC"),
  f("eth.dst", "mac", "Destination MAC"),
  f("eth.addr", "mac", "Source or destination MAC"),
  f("eth.type", "num", "Ethertype"),
  f("vlan.id", "num", "802.1Q VLAN ID"),
  f("sll", "proto", "Linux cooked capture"),
  f("arp", "proto", "Address Resolution Protocol"),
  f("arp.opcode", "num", "ARP opcode (1 request, 2 reply)"),
  f("arp.src.hw_mac", "mac", "ARP sender MAC"),
  f("arp.src.proto_ipv4", "ip", "ARP sender IP"),
  f("arp.dst.hw_mac", "mac", "ARP target MAC"),
  f("arp.dst.proto_ipv4", "ip", "ARP target IP"),
  f("ip", "proto", "IPv4"),
  f("ip.src", "ip", "IPv4 source"),
  f("ip.dst", "ip", "IPv4 destination"),
  f("ip.addr", "ip", "IPv4 source or destination"),
  f("ip.ttl", "num", "Time to live"),
  f("ip.proto", "num", "IP protocol number"),
  f("ip.len", "num", "IP total length"),
  f("ip.id", "num", "IP identification"),
  f("ip.hdr_len", "num", "IP header length"),
  f("ip.dsfield", "num", "Differentiated services field"),
  f("ip.flags.df", "bool", "Don't fragment flag"),
  f("ip.flags.mf", "bool", "More fragments flag"),
  f("ip.frag_offset", "num", "Fragment offset"),
  f("ip.checksum", "num", "Header checksum"),
  f("ip.version", "num", "IP version"),
  f("ipv6", "proto", "IPv6"),
  f("ipv6.src", "ip", "IPv6 source"),
  f("ipv6.dst", "ip", "IPv6 destination"),
  f("ipv6.addr", "ip", "IPv6 source or destination"),
  f("ipv6.nxt", "num", "Next header"),
  f("ipv6.hlim", "num", "Hop limit"),
  f("ipv6.plen", "num", "Payload length"),
  f("ipv6.flow", "num", "Flow label"),
  f("ipv6.tclass", "num", "Traffic class"),
  f("ipv6.version", "num", "IP version"),
  f("tcp", "proto", "Transmission Control Protocol"),
  f("tcp.port", "num", "TCP source or destination port"),
  f("tcp.srcport", "num", "TCP source port"),
  f("tcp.dstport", "num", "TCP destination port"),
  f("tcp.stream", "num", "TCP stream index"),
  f("tcp.seq", "num", "Relative sequence number"),
  f("tcp.seq_raw", "num", "Raw sequence number"),
  f("tcp.ack", "num", "Relative acknowledgment number"),
  f("tcp.len", "num", "TCP payload length"),
  f("tcp.hdr_len", "num", "TCP header length"),
  f("tcp.window_size", "num", "Window size"),
  f("tcp.checksum", "num", "TCP checksum"),
  f("tcp.flags.syn", "bool", "SYN flag"),
  f("tcp.flags.ack", "bool", "ACK flag"),
  f("tcp.flags.push", "bool", "PSH flag"),
  f("tcp.flags.reset", "bool", "RST flag"),
  f("tcp.flags.fin", "bool", "FIN flag"),
  f("udp", "proto", "User Datagram Protocol"),
  f("udp.port", "num", "UDP source or destination port"),
  f("udp.srcport", "num", "UDP source port"),
  f("udp.dstport", "num", "UDP destination port"),
  f("udp.length", "num", "UDP length"),
  f("udp.checksum", "num", "UDP checksum"),
  f("udp.stream", "num", "UDP stream index"),
  f("icmp", "proto", "ICMP"),
  f("icmp.type", "num", "ICMP type"),
  f("icmp.code", "num", "ICMP code"),
  f("icmp.ident", "num", "Echo identifier"),
  f("icmp.seq", "num", "Echo sequence number"),
  f("icmp.checksum", "num", "ICMP checksum"),
  f("icmpv6", "proto", "ICMPv6"),
  f("icmpv6.type", "num", "ICMPv6 type"),
  f("icmpv6.code", "num", "ICMPv6 code"),
  f("icmpv6.nd.ns.target_address", "ip", "Neighbor discovery target"),
  f("igmp", "proto", "IGMP"),
  f("dns", "proto", "Domain Name System (incl. mDNS, LLMNR)"),
  f("mdns", "proto", "Multicast DNS"),
  f("dns.id", "num", "Transaction ID"),
  f("dns.qry.name", "str", "Queried name"),
  f("dns.qry.type", "num", "Query type (1=A, 28=AAAA…)"),
  f("dns.flags.response", "bool", "Is a response"),
  f("dns.flags.rcode", "num", "Reply code"),
  f("dns.count.queries", "num", "Number of questions"),
  f("dns.count.answers", "num", "Number of answers"),
  f("dns.resp.name", "str", "Answer name"),
  f("dns.resp.type", "num", "Answer type"),
  f("dns.resp.ttl", "num", "Answer TTL"),
  f("dns.a", "ip", "A record address"),
  f("dns.aaaa", "ip", "AAAA record address"),
  f("dns.cname", "str", "CNAME target"),
  f("dns.ns", "str", "Name server"),
  f("dns.ptr.domain_name", "str", "PTR domain name"),
  f("http", "proto", "HTTP/1.x"),
  f("http.request", "bool", "Is an HTTP request"),
  f("http.response", "bool", "Is an HTTP response"),
  f("http.request.method", "str", "Request method"),
  f("http.request.uri", "str", "Request URI"),
  f("http.request.version", "str", "Request version"),
  f("http.response.code", "num", "Status code"),
  f("http.response.phrase", "str", "Status phrase"),
  f("http.host", "str", "Host header"),
  f("http.user_agent", "str", "User-Agent header"),
  f("http.content_type", "str", "Content-Type header"),
  f("http.content_length", "num", "Content-Length header"),
  f("http.server", "str", "Server header"),
  f("http.cookie", "str", "Cookie header"),
  f("http.set_cookie", "str", "Set-Cookie header"),
  f("http.referer", "str", "Referer header"),
  f("http.location", "str", "Location header"),
  f("http.authorization", "str", "Authorization header"),
  f("tls", "proto", "Transport Layer Security"),
  f("tls.record.content_type", "num", "Record type (22 handshake, 23 data)"),
  f("tls.record.version", "num", "Record version"),
  f("tls.record.length", "num", "Record length"),
  f("tls.handshake.type", "num", "Handshake type (1 Client Hello, 2 Server Hello)"),
  f("tls.handshake.version", "num", "Hello version"),
  f("tls.handshake.ciphersuite", "num", "Chosen cipher suite"),
  f("tls.handshake.extensions_server_name", "str", "SNI hostname"),
  f("tls.handshake.extensions_alpn_str", "str", "ALPN protocol"),
  f("quic", "proto", "QUIC"),
  f("quic.version", "num", "QUIC version"),
  f("quic.long.packet_type", "num", "Long header packet type"),
  f("quic.dcid", "str", "Destination connection ID"),
  f("dhcp", "proto", "DHCP"),
  f("dhcp.type", "num", "BOOTP message type"),
  f("dhcp.id", "num", "Transaction ID"),
  f("dhcp.option.dhcp", "num", "DHCP message type"),
  f("dhcp.option.hostname", "str", "Client hostname"),
  f("dhcp.ip.your", "ip", "Offered address"),
  f("dhcp.hw.mac_addr", "mac", "Client MAC"),
  f("ntp", "proto", "Network Time Protocol"),
  f("ntp.mode", "num", "NTP mode"),
  f("ssdp", "proto", "SSDP"),
  f("ssh", "proto", "SSH"),
  f("null", "proto", "Loopback"),
  f("null.family", "num", "Address family"),
  f("lldp", "proto", "LLDP"),
  f("eapol", "proto", "802.1X authentication (EAPOL)"),
  f("gre", "proto", "GRE tunnel"),
  f("esp", "proto", "IPsec ESP"),
  f("llmnr", "proto", "Link-Local Multicast Name Resolution"),
  f("tlsv1.0", "proto", "TLS 1.0 records"),
  f("tlsv1.1", "proto", "TLS 1.1 records"),
  f("tlsv1.2", "proto", "TLS 1.2 records"),
  f("tlsv1.3", "proto", "TLS 1.3 records"),
  f("ipv4", "proto", "IPv4 (same as ip)"),
  f("ethernet", "proto", "Ethernet (same as eth)"),
  f("loopback", "proto", "Null/Loopback (same as null)"),
];

/** Names that stand in for another protocol name, e.g. "ipv4" for "ip". */
export const PROTO_ALIASES: Record<string, string> = {
  ipv4: "ip",
  ethernet: "eth",
  loopback: "null",
};

/**
 * Protocol names whose bare form means "every frame that carries it".
 * Every packet is a frame, so typing "frame" lists the whole capture.
 */
export const CONTAINS_BY_DEFAULT = new Set(["frame"]);

/** Bare names that also cover their variants, e.g. "tls" covers "TLSv1.2". */
export const PROTO_FAMILY: Record<string, string[]> = {
  tls: ["tls", "tlsv1.0", "tlsv1.1", "tlsv1.2", "tlsv1.3"],
  dns: ["dns", "mdns", "llmnr"],
};

/** Every protocol name that can be typed into the display filter. */
export const PROTO_NAMES: string[] = FIELD_DEFS.filter((d) => d.type === "proto").map((d) => d.name);
const PROTO_NAME_SET = new Set(PROTO_NAMES);

/** "tcp.frame" = any frame carrying TCP, even one labelled HTTP. */
export const PROTO_FRAME_DEFS: FieldDef[] = PROTO_NAMES
  .filter((n) => n !== "frame" && !PROTO_ALIASES[n])
  .map((n) => f(`${n}.frame`, "bool", `Frame containing ${n}`));

export const ALL_FIELD_DEFS: FieldDef[] = [...FIELD_DEFS, ...PROTO_FRAME_DEFS];

export const FIELD_MAP = new Map(ALL_FIELD_DEFS.map((d) => [d.name, d]));

/** Canonical protocol name for a typed name (resolves aliases like "ipv4"). */
export function canonicalProtocol(name: string): string {
  return PROTO_ALIASES[name] ?? name;
}

/** Protocol names a typed bare protocol stands for, e.g. tls → TLSv1.0/1.2/1.3. */
export function protocolFamily(name: string): string[] {
  const canon = canonicalProtocol(name);
  return PROTO_FAMILY[canon] ?? [canon];
}

/** Base protocol of a "<proto>.frame" field, or null when it is not one. */
export function frameFieldBase(name: string): string | null {
  if (!name.endsWith(".frame")) return null;
  const base = name.slice(0, -".frame".length);
  return PROTO_NAME_SET.has(base) ? base : null;
}
