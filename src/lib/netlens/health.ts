import type { Packet } from "./types";

/** Overall plain-language verdict for a whole capture. */
export type HealthVerdict = "healthy" | "watch" | "troubled";
export type PhaseStatus = "ok" | "slow" | "missing";

/** One measured step of a connection, e.g. how long a name lookup took. */
export interface PhaseTiming {
  id: "dns" | "handshake" | "tls" | "first-byte";
  label: string;
  plain: string;
  detail: string;
  medianMs: number | null;
  worstMs: number | null;
  samples: number;
  slowMs: number;
  status: PhaseStatus;
  packetNos: number[];
}

/** A TCP-level problem, shaped like a Finding so the workspace can focus it. */
export interface HealthProblem {
  id: string;
  level: "review" | "notice";
  title: string;
  explanation: string;
  next: string;
  packetNos: number[];
}

export interface HealthReport {
  verdict: HealthVerdict;
  headline: string;
  summary: string;
  connections: number;
  answered: number;
  phases: PhaseTiming[];
  problems: HealthProblem[];
  affected: number;
}

const num = (p: Packet, key: string) => Number(p.fields.get(key)?.[0] ?? 0);
const text = (p: Packet, key: string) => {
  const v = p.fields.get(key)?.[0];
  return v === undefined ? "" : String(v);
};

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

interface Sample {
  ms: number;
  packetNos: number[];
  detail: string;
}

function makePhase(
  id: PhaseTiming["id"],
  label: string,
  plain: string,
  slowMs: number,
  samples: Sample[],
): PhaseTiming {
  const ms = samples.map((s) => s.ms);
  let worst: Sample | null = null;
  for (const s of samples) if (!worst || s.ms > worst.ms) worst = s;
  const worstMs = ms.length ? Math.max(...ms) : null;
  return {
    id,
    label,
    plain,
    detail: worst?.detail ?? "",
    medianMs: median(ms),
    worstMs,
    samples: samples.length,
    slowMs,
    status: !samples.length ? "missing" : worstMs !== null && worstMs > slowMs ? "slow" : "ok",
    packetNos: worst?.packetNos ?? [],
  };
}

/**
 * Reads a whole capture and works out how each connection behaved: how long each
 * step took and whether data had to be sent again. Everything is derived from the
 * packets already on this device — no lookups leave the browser.
 */
export function assessHealth(packets: Packet[]): HealthReport {
  // --- name lookups: pair each question with its answer by transaction id + name ---
  const dnsSamples: Sample[] = [];
  const pending = new Map<string, { no: number; rel: number; name: string }>();
  const answeredKeys = new Set<string>();
  for (const p of packets) {
    const name = text(p, "dns.qry.name") || text(p, "dns.resp.name");
    if (!name) continue;
    const key = `${num(p, "dns.id")}|${name.toLowerCase()}`;
    if (num(p, "dns.flags.response") === 1) {
      const q = pending.get(key);
      if (q && !answeredKeys.has(key)) {
        answeredKeys.add(key);
        dnsSamples.push({ ms: Math.max(0, (p.rel - q.rel) * 1000), packetNos: [q.no, p.no], detail: q.name });
      }
    } else if (!pending.has(key)) pending.set(key, { no: p.no, rel: p.rel, name });
  }
  const dnsTimeouts = packets.filter((p) => {
    const name = text(p, "dns.qry.name");
    if (!name || num(p, "dns.flags.response") === 1) return false;
    return !answeredKeys.has(`${num(p, "dns.id")}|${name.toLowerCase()}`);
  });

  // --- group TCP packets per stream ---
  const streams = new Map<string, Packet[]>();
  for (const p of packets) {
    if (p.stream?.kind !== "tcp") continue;
    const key = `tcp:${p.stream.index}`;
    const list = streams.get(key);
    if (list) list.push(p);
    else streams.set(key, [p]);
  }

  const handshake: Sample[] = [];
  const tls: Sample[] = [];
  const firstByte: Sample[] = [];
  const noAnswer: Packet[] = [];
  const retransmissions: Packet[] = [];
  const outOfOrder: Packet[] = [];
  const duplicateAcks: Packet[] = [];
  const zeroWindows: Packet[] = [];
  const resets: Packet[] = [];
  let answered = 0;

  for (const list of streams.values()) {
    const ordered = [...list].sort((a, b) => a.rel - b.rel);
    const synIndex = ordered.findIndex((p) => num(p, "tcp.flags.syn") === 1 && num(p, "tcp.flags.ack") === 0);
    const syn = synIndex >= 0 ? ordered[synIndex] : undefined;
    const synAck = syn
      ? ordered.slice(synIndex + 1).find((p) => num(p, "tcp.flags.syn") === 1 && num(p, "tcp.flags.ack") === 1)
      : undefined;
    if (syn && !synAck) noAnswer.push(syn);
    if (syn && synAck) {
      answered++;
      handshake.push({
        ms: Math.max(0, (synAck.rel - syn.rel) * 1000),
        packetNos: [syn.no, synAck.no],
        detail: `${syn.dst}:${text(syn, "tcp.dstport")}`,
      });
    }
    const helloIndex = ordered.findIndex((p) => num(p, "tls.handshake.type") === 1);
    const hello = helloIndex >= 0 ? ordered[helloIndex] : undefined;
    const serverHello = hello
      ? ordered.slice(helloIndex + 1).find((p) => num(p, "tls.handshake.type") === 2)
      : undefined;
    if (hello && serverHello) {
      tls.push({
        ms: Math.max(0, (serverHello.rel - hello.rel) * 1000),
        packetNos: [hello.no, serverHello.no],
        detail: text(hello, "tls.handshake.extensions_server_name") || hello.dst,
      });
    }
    const clientData = ordered.find((p) => p.stream?.fromClient && (p.payload?.length ?? 0) > 0);
    const serverData = clientData
      ? ordered.find((p) => !p.stream?.fromClient && (p.payload?.length ?? 0) > 0)
      : undefined;
    if (clientData && serverData) {
      firstByte.push({
        ms: Math.max(0, (serverData.rel - clientData.rel) * 1000),
        packetNos: [clientData.no, serverData.no],
        detail: text(clientData, "http.host") || clientData.dst,
      });
    }

    // Each direction keeps its own sequence bookkeeping, otherwise a reply
    // looks like it arrived "out of order" compared with the request.
    const seen = new Set<string>();
    const highest = new Map<boolean, number>();
    const ackBuckets = new Map<string, Packet[]>();
    for (const p of ordered) {
      const payload = p.payload;
      const len = payload?.length ?? 0;
      const dir = p.stream?.fromClient ?? true;
      if (payload && len > 0) {
        const seq = payload.seq;
        const key = `${dir}:${seq}:${len}`;
        if (seen.has(key)) retransmissions.push(p);
        else {
          seen.add(key);
          const top = highest.get(dir);
          if (top !== undefined && seq < top) outOfOrder.push(p);
          highest.set(dir, Math.max(top ?? 0, seq + len));
        }
      }
      if (!p.layers.includes("tcp")) continue;
      const win = p.fields.get("tcp.window_size");
      if (win && win.length && Number(win[0]) === 0) zeroWindows.push(p);
      if (num(p, "tcp.flags.reset") === 1) resets.push(p);
      if (len === 0 && num(p, "tcp.flags.ack") === 1) {
        const key = `${dir}:${num(p, "tcp.ack")}`;
        const bucket = ackBuckets.get(key);
        if (bucket) bucket.push(p);
        else ackBuckets.set(key, [p]);
      }
    }
    for (const bucket of ackBuckets.values()) if (bucket.length >= 3) duplicateAcks.push(...bucket);
  }

  const phases = [
    makePhase("dns", "Name lookup", "How long a website name took to be answered", 150, dnsSamples),
    makePhase("handshake", "Connection setup", "How long the two sides took to agree to talk", 300, handshake),
    makePhase("tls", "Secure handshake", "How long the encrypted session setup took", 500, tls),
    makePhase("first-byte", "First reply", "How long the first answer took after a request", 1000, firstByte),
  ];

  const problems: HealthProblem[] = [];
  const add = (
    id: string,
    level: HealthProblem["level"],
    title: string,
    explanation: string,
    next: string,
    matches: Packet[],
  ) => {
    if (matches.length) problems.push({ id, level, title, explanation, next, packetNos: matches.map((p) => p.no) });
  };
  add(
    "no-answer",
    "review",
    "A connection never answered",
    "A device asked to open a connection and nothing ever replied. A closed port, a firewall or a server that is down can all do this.",
    "Check the packets just after the request, and try the same address again from the app that failed.",
    noAnswer,
  );
  add(
    "retransmission",
    "review",
    "Data had to be sent again",
    "The same bytes were sent more than once in one conversation. That usually means a reply went missing, so the sender tried again.",
    "Look at the timing of the connection setup and the first reply — slow answers and lost data usually appear together.",
    retransmissions,
  );
  add(
    "out-of-order",
    "review",
    "Some data arrived out of order",
    "A later piece of data showed up before an earlier one. Busy networks and virtual adapters can do this; it only matters when it happens a lot.",
    "Check whether the same conversation also had data sent again or a very small window.",
    outOfOrder,
  );
  add(
    "zero-window",
    "review",
    "One side had no room left",
    "A device said its receiving space was full, so the other side had to pause. A slow app or a busy phone can cause this.",
    "Find the conversation with the pause and check what the app on that side was doing.",
    zeroWindows,
  );
  add(
    "dns-timeout",
    "notice",
    "A name lookup never answered",
    "A question asking where a website lives was asked, but no reply was captured. A slow DNS server or a blocked lookup can do this.",
    "Compare it with the lookups that did answer, and check which address the device was asking.",
    dnsTimeouts,
  );
  add(
    "duplicate-ack",
    "notice",
    "The same confirmation was repeated",
    "One side kept repeating the same confirmation. That is usually how a device says 'I am still missing something'.",
    "Open the conversation and look for data that had to be sent again nearby.",
    duplicateAcks,
  );
  add(
    "reset",
    "notice",
    "A connection ended suddenly",
    "A reset stopped a conversation before it finished. Apps, closed ports and network equipment do this; a reset alone is not suspicious.",
    "Read the packets just before the reset to see what the app was asking for.",
    resets,
  );

  const affected = new Set(problems.flatMap((p) => p.packetNos)).size;
  const review = problems.filter((p) => p.level === "review");
  const slow = phases.filter((p) => p.status === "slow");
  const verdict: HealthVerdict = review.length ? "troubled" : problems.length || slow.length ? "watch" : "healthy";
  const headline =
    verdict === "healthy"
      ? "This capture looks healthy"
      : verdict === "watch"
        ? "A few things are worth a look"
        : "This capture shows real trouble";
  const parts = [
    review.length ? `${review.map((p) => p.title.toLowerCase()).join(", ")}` : "",
    slow.length ? `slow ${slow.map((p) => p.label.toLowerCase()).join(" and ")}` : "",
    !review.length && problems.length ? problems.map((p) => p.title.toLowerCase()).join(", ") : "",
  ].filter(Boolean);
  const summary =
    verdict === "healthy"
      ? `Every connection that asked got an answer, and nothing had to be sent twice. ${answered} of ${streams.size} connections completed their setup.`
      : `${parts.join("; ")}. Nothing here proves an attack — start with the items marked "check first".`;

  return {
    verdict,
    headline,
    summary,
    connections: streams.size,
    answered,
    phases,
    problems,
    affected,
  };
}

/** Formats a millisecond value the way a beginner would read it. */
export function msText(ms: number | null): string {
  if (ms === null) return "not visible";
  if (ms < 1) return "under 1 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}
