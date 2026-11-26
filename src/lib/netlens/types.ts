export type FieldValue = string | number;

/** A captured frame as read from a pcap/pcapng file or a live capture stream. */
export interface RawPacket {
  /** Seconds since the Unix epoch (fractional). */
  ts: number;
  capLen: number;
  origLen: number;
  linkType: number;
  data: Uint8Array;
}

export interface TreeNode {
  label: string;
  /** Byte offset of this item inside the frame. */
  start: number;
  length: number;
  children: TreeNode[];
  /** Display-filter field name (e.g. "ip.src") when this node is a filterable field. */
  field: string | null;
  value: FieldValue | null;
}

export type ProtoKey =
  | "tcp"
  | "udp"
  | "http"
  | "tls"
  | "dns"
  | "arp"
  | "icmp"
  | "quic"
  | "dhcp"
  | "alert"
  | "other";

export interface StreamRef {
  kind: "tcp" | "udp";
  index: number;
  fromClient: boolean;
}

export interface Payload {
  offset: number;
  length: number;
  /** Relative TCP sequence number of the first payload byte (0 for UDP). */
  seq: number;
}

export interface Packet {
  /** 1-based frame number. */
  no: number;
  ts: number;
  /** Seconds since the first packet. */
  rel: number;
  /** Seconds since the previous packet. */
  delta: number;
  len: number;
  capLen: number;
  linkType: number;
  data: Uint8Array;
  src: string;
  dst: string;
  protocol: string;
  info: string;
  proto: ProtoKey;
  /** Canonical name of the protocol shown in the list, e.g. "tcp" or "tlsv1.2". */
  top: string;
  layers: string[];
  fields: Map<string, FieldValue[]>;
  stream: StreamRef | null;
  payload: Payload | null;
  tcpRel: { seq: number; ack: number } | null;
  /** Network-layer endpoints, used for conversations/endpoints statistics. */
  netSrc: string;
  netDst: string;
}
