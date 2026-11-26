import type { Packet } from "./types";

export interface SearchHit {
  no: number;
  field: string;
  value: string;
}

export interface SearchResult {
  hits: SearchHit[];
  matched: Set<number>;
  truncated: boolean;
  error: string | null;
}

/**
 * Looks for a word or pattern in every decoded value of every packet — the
 * closest thing to Wireshark's "find packet" that works on a whole capture.
 * Runs entirely on this device over the packets already open in the tab.
 */
export function searchPackets(
  packets: Packet[],
  query: string,
  opts: { regex?: boolean; max?: number } = {},
): SearchResult {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [], matched: new Set(), truncated: false, error: null };
  let matcher: (s: string) => boolean;
  if (opts.regex) {
    let re: RegExp;
    try {
      re = new RegExp(trimmed, "i");
    } catch {
      return { hits: [], matched: new Set(), truncated: false, error: "That pattern is not a valid regular expression." };
    }
    matcher = (s) => re.test(s);
  } else {
    const lower = trimmed.toLowerCase();
    matcher = (s) => s.toLowerCase().includes(lower);
    const exact = lower;
    const base = matcher;
    matcher = (s) => base(s) || s.toLowerCase() === exact;
  }
  const max = opts.max ?? 400;
  const hits: SearchHit[] = [];
  const matched = new Set<number>();
  let truncated = false;
  const full = () => hits.length >= max;
  for (const p of packets) {
    let hitHere = false;
    const push = (field: string, value: string) => {
      if (full()) {
        truncated = true;
        return;
      }
      hits.push({ no: p.no, field, value });
      hitHere = true;
    };
    for (const [key, values] of p.fields) {
      if (full()) break;
      for (const v of values) {
        const s = String(v);
        if (s && matcher(s)) push(key, s);
        if (full()) break;
      }
    }
    if (!full() && matcher(p.info)) push("frame.info", p.info);
    if (!full() && (matcher(p.src) || matcher(p.dst))) push("ip.addr", `${p.src} → ${p.dst}`);
    if (!full() && matcher(p.protocol)) push("frame.protocols", p.protocol);
    if (hitHere) matched.add(p.no);
    if (full()) {
      truncated = true;
      break;
    }
  }
  return { hits, matched, truncated, error: null };
}

/** A filter that matches everything like the selected packet. */
export function findLikeThis(p: Packet): string {
  if (p.stream) return `${p.stream.kind}.stream == ${p.stream.index}`;
  const ipv4 = /^\d+\.\d+\.\d+\.\d+$/;
  if (ipv4.test(p.netSrc) && ipv4.test(p.netDst)) return `ip.addr == ${p.netSrc} and ip.addr == ${p.netDst}`;
  const proto = p.proto === "other" || p.proto === "alert" ? null : p.proto;
  return proto ? String(proto) : "frame";
}
