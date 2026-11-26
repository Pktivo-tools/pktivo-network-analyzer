import type { Packet } from "./types";

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const hasNote = (notes: Map<number, string>, no: number) => !!notes.get(no)?.trim();

/** Notes as CSV: one row per marked packet, safe to open in a spreadsheet. */
export function notesCsv(packets: Packet[], notes: Map<number, string>): string {
  const rows = ["packet_no,time_seconds,source,destination,protocol,length_bytes,note"];
  for (const p of packets) {
    const note = notes.get(p.no);
    if (!note || !hasNote(notes, p.no)) continue;
    rows.push(
      [
        String(p.no),
        p.rel.toFixed(6),
        p.src,
        p.dst,
        p.protocol,
        String(p.len),
        csvCell(note),
      ].join(","),
    );
  }
  return `${rows.join("\n")}\n`;
}

/** Notes as JSON, keeping the same fields so other tools can read them. */
export function notesJson(packets: Packet[], notes: Map<number, string>): string {
  const items = packets
    .filter((p) => hasNote(notes, p.no))
    .map((p) => ({
      no: p.no,
      timeSeconds: Number(p.rel.toFixed(6)),
      source: p.src,
      destination: p.dst,
      protocol: p.protocol,
      lengthBytes: p.len,
      note: notes.get(p.no) ?? "",
    }));
  return `${JSON.stringify(items, null, 2)}\n`;
}
