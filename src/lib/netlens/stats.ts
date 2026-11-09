import type { Packet, ProtoKey } from "./types";

export interface CaptureStats {
  packets: number;
  bytes: number;
  duration: number;
  avgPps: number;
  avgBps: number;
  avgSize: number;
  protocols: { name: string; proto: ProtoKey; packets: number; bytes: number }[];
  io: { t: number; packets: number; bytes: number }[];
  ioStep: number;
  conversations: { a: string; b: string; packets: number; bytes: number; aToB: number; bToA: number }[];
  endpoints: { addr: string; packets: number; bytes: number; tx: number; rx: number }[];
  ports: { port: number; transport: string; packets: number }[];
}

const STEPS = [0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60, 300, 600, 1800, 3600];

export function computeStats(packets: Packet[]): CaptureStats {
  const n = packets.length;
  const first = packets[0];
  const last = packets[n - 1];
  const duration = first && last ? Math.max(0, last.rel - first.rel) : 0;
  let bytes = 0;
  const protos = new Map<string, { name: string; proto: ProtoKey; packets: number; bytes: number }>();
  const convs = new Map<string, { a: string; b: string; packets: number; bytes: number; aToB: number; bToA: number }>();
  const eps = new Map<string, { addr: string; packets: number; bytes: number; tx: number; rx: number }>();
  const ports = new Map<string, { port: number; transport: string; packets: number }>();

  const step = STEPS.find((s) => duration / s <= 120) ?? 3600;
  const startRel = first?.rel ?? 0;
  const buckets = Math.max(1, Math.floor(duration / step) + 1);
  const io = Array.from({ length: buckets }, (_, i) => ({ t: Number((startRel + i * step).toFixed(3)), packets: 0, bytes: 0 }));

  for (const p of packets) {
    bytes += p.len;
    const pr = protos.get(p.protocol) ?? { name: p.protocol, proto: p.proto, packets: 0, bytes: 0 };
    pr.packets++;
    pr.bytes += p.len;
    protos.set(p.protocol, pr);

    const bi = Math.min(buckets - 1, Math.floor((p.rel - startRel) / step));
    const b = io[bi];
    if (b) {
      b.packets++;
      b.bytes += p.len;
    }

    if (p.netSrc && p.netDst) {
      const [a, z] = p.netSrc < p.netDst ? [p.netSrc, p.netDst] : [p.netDst, p.netSrc];
      const key = `${a}|${z}`;
      const c = convs.get(key) ?? { a, b: z, packets: 0, bytes: 0, aToB: 0, bToA: 0 };
      c.packets++;
      c.bytes += p.len;
      if (p.netSrc === a) c.aToB += p.len;
      else c.bToA += p.len;
      convs.set(key, c);
      for (const [addr, dir] of [
        [p.netSrc, "tx"],
        [p.netDst, "rx"],
      ] as const) {
        const e = eps.get(addr) ?? { addr, packets: 0, bytes: 0, tx: 0, rx: 0 };
        e.packets++;
        e.bytes += p.len;
        e[dir] += p.len;
        eps.set(addr, e);
      }
    }
    const transport = p.layers.includes("tcp") ? "tcp" : p.layers.includes("udp") ? "udp" : null;
    if (transport) {
      const sp = Number(p.fields.get(`${transport}.srcport`)?.[0] ?? 0);
      const dp = Number(p.fields.get(`${transport}.dstport`)?.[0] ?? 0);
      const port = Math.min(sp, dp);
      const key = `${transport}/${port}`;
      const e = ports.get(key) ?? { port, transport: transport.toUpperCase(), packets: 0 };
      e.packets++;
      ports.set(key, e);
    }
  }

  return {
    packets: n,
    bytes,
    duration,
    avgPps: duration > 0 ? n / duration : n,
    avgBps: duration > 0 ? (bytes * 8) / duration : bytes * 8,
    avgSize: n ? bytes / n : 0,
    protocols: [...protos.values()].sort((a, b) => b.packets - a.packets),
    io,
    ioStep: step,
    conversations: [...convs.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 25),
    endpoints: [...eps.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 25),
    ports: [...ports.values()].sort((a, b) => b.packets - a.packets).slice(0, 10),
  };
}
