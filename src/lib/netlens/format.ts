export function macStr(d: Uint8Array, o: number): string {
  return Array.from(d.subarray(o, o + 6), (b) => b.toString(16).padStart(2, "0")).join(":");
}

export function ipv4Str(d: Uint8Array, o: number): string {
  return Array.from(d.subarray(o, o + 4)).join(".");
}

export function ipv6Str(d: Uint8Array, o: number): string {
  const v = new DataView(d.buffer, d.byteOffset + o, 16);
  const g: number[] = [];
  for (let i = 0; i < 8; i++) g.push(v.getUint16(i * 2, false));
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (g[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && g[j] === 0) j++;
    if (j - i > bestLen && j - i >= 2) {
      bestStart = i;
      bestLen = j - i;
    }
    i = j;
  }
  const hex = (n: number | undefined) => (n ?? 0).toString(16);
  if (bestStart < 0) return g.map(hex).join(":");
  const left = g.slice(0, bestStart).map(hex).join(":");
  const right = g.slice(bestStart + bestLen).map(hex).join(":");
  return `${left}::${right}`;
}

export function hex(n: number, width = 4): string {
  return "0x" + n.toString(16).padStart(width, "0");
}

export function ipv4ToInt(s: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return (((parts[0] ?? 0) << 24) | ((parts[1] ?? 0) << 16) | ((parts[2] ?? 0) << 8) | (parts[3] ?? 0)) >>> 0;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDuration(s: number): string {
  if (s < 1) return `${(s * 1000).toFixed(0)} ms`;
  if (s < 60) return `${s.toFixed(2)} s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s % 60)}s`;
}

export function printable(b: number): string {
  return b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".";
}

export function asciiText(d: Uint8Array): string {
  let s = "";
  for (const b of d) {
    if (b === 0x0a || b === 0x0d || b === 0x09) s += String.fromCharCode(b);
    else s += printable(b);
  }
  return s;
}
