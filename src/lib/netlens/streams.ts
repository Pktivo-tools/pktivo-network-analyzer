import type { Packet } from "./types";

export interface StreamSegment {
  fromClient: boolean;
  bytes: Uint8Array;
  packetNo: number;
}

export interface FollowedStream {
  kind: "tcp" | "udp";
  index: number;
  client: string;
  server: string;
  segments: StreamSegment[];
  clientBytes: number;
  serverBytes: number;
  packetCount: number;
}

/** Rebuilds the payload conversation of one TCP/UDP stream, merging consecutive same-direction data. */
export function followStream(packets: Packet[], kind: "tcp" | "udp", index: number): FollowedStream {
  const members = packets.filter((p) => p.stream?.kind === kind && p.stream.index === index);
  let client = "";
  let server = "";
  const seen = new Set<string>();
  const segments: StreamSegment[] = [];
  let clientBytes = 0;
  let serverBytes = 0;
  for (const p of members) {
    const port = (dir: "src" | "dst") => p.fields.get(`${kind}.${dir}port`)?.[0] ?? "";
    const a = `${p.netSrc}:${port("src")}`;
    const b = `${p.netDst}:${port("dst")}`;
    if (!client) {
      client = p.stream?.fromClient ? a : b;
      server = p.stream?.fromClient ? b : a;
    }
    if (!p.payload || p.payload.length === 0) continue;
    const fromClient = p.stream?.fromClient ?? true;
    if (kind === "tcp") {
      const key = `${fromClient}:${p.payload.seq}:${p.payload.length}`;
      if (seen.has(key)) continue; // retransmission
      seen.add(key);
    }
    const bytes = p.data.subarray(p.payload.offset, p.payload.offset + p.payload.length);
    if (fromClient) clientBytes += bytes.length;
    else serverBytes += bytes.length;
    const last = segments[segments.length - 1];
    if (last && last.fromClient === fromClient) {
      const merged = new Uint8Array(last.bytes.length + bytes.length);
      merged.set(last.bytes);
      merged.set(bytes, last.bytes.length);
      last.bytes = merged;
    } else segments.push({ fromClient, bytes, packetNo: p.no });
  }
  return { kind, index, client, server, segments, clientBytes, serverBytes, packetCount: members.length };
}
