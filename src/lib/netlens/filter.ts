import type { Packet, FieldValue } from "./types";
import { FIELD_MAP } from "./fields";
import { ipv4ToInt } from "./format";

type Op = "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "matches";

interface Literal {
  raw: string;
  lower: string;
  num: number | null;
  cidr: { base: number; mask: number } | null;
  regex: RegExp | null;
}

type Node =
  | { t: "or"; a: Node; b: Node }
  | { t: "and"; a: Node; b: Node }
  | { t: "not"; a: Node }
  | { t: "exists"; f: string }
  | { t: "cmp"; f: string; op: Op; lit: Literal };

export type FilterResult =
  | { ok: true; empty: boolean; test: (p: Packet) => boolean }
  | { ok: false; error: string };

interface Tok {
  k: "word" | "str" | "op" | "lp" | "rp";
  v: string;
  pos: number;
}

const OPS: Record<string, Op | "and" | "or" | "not"> = {
  "==": "==",
  eq: "==",
  "!=": "!=",
  ne: "!=",
  ">": ">",
  gt: ">",
  "<": "<",
  lt: "<",
  ">=": ">=",
  ge: ">=",
  "<=": "<=",
  le: "<=",
  contains: "contains",
  matches: "matches",
  "~": "matches",
  "&&": "and",
  and: "and",
  "||": "or",
  or: "or",
  "!": "not",
  not: "not",
};

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i] ?? "";
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(") {
      out.push({ k: "lp", v: c, pos: i++ });
      continue;
    }
    if (c === ")") {
      out.push({ k: "rp", v: c, pos: i++ });
      continue;
    }
    const two = s.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) {
      out.push({ k: "op", v: two, pos: i });
      i += 2;
      continue;
    }
    if (c === ">" || c === "<" || c === "!" || c === "~") {
      out.push({ k: "op", v: c, pos: i++ });
      continue;
    }
    if (c === '"' || c === "'") {
      const start = i;
      let v = "";
      i++;
      while (i < s.length && s[i] !== c) {
        if (s[i] === "\\" && i + 1 < s.length) {
          v += s[i + 1];
          i += 2;
        } else v += s[i++];
      }
      if (i >= s.length) throw new FilterError(`Missing closing quote`, start);
      i++;
      out.push({ k: "str", v, pos: start });
      continue;
    }
    const m = /^[A-Za-z0-9_.:\-/]+/.exec(s.slice(i));
    if (!m) throw new FilterError(`Unexpected character "${c}"`, i);
    const w = m[0];
    const lw = w.toLowerCase();
    const op = OPS[lw];
    out.push({ k: op && /^[a-z]+$/.test(lw) ? "op" : "word", v: op && /^[a-z]+$/.test(lw) ? lw : w, pos: i });
    i += w.length;
  }
  return out;
}

class FilterError extends Error {
  constructor(
    msg: string,
    public pos: number,
  ) {
    super(msg);
  }
}

function makeLiteral(raw: string, isString: boolean, op: Op): Literal {
  const lower = raw.toLowerCase();
  let num: number | null = null;
  if (!isString) {
    if (/^0x[0-9a-f]+$/i.test(raw)) num = parseInt(raw, 16);
    else if (/^-?\d+(\.\d+)?$/.test(raw)) num = Number(raw);
    else if (lower === "true") num = 1;
    else if (lower === "false") num = 0;
  }
  let cidr: Literal["cidr"] = null;
  const cm = /^(\d+\.\d+\.\d+\.\d+)\/(\d{1,2})$/.exec(raw);
  if (cm) {
    const base = ipv4ToInt(cm[1] ?? "");
    const bits = Number(cm[2]);
    if (base !== null && bits <= 32) {
      const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
      cidr = { base: (base & mask) >>> 0, mask };
    }
  }
  let regex: RegExp | null = null;
  if (op === "matches") {
    try {
      regex = new RegExp(raw, "i");
    } catch {
      throw new FilterError(`Invalid regular expression "${raw}"`, 0);
    }
  }
  return { raw, lower, num, cidr, regex };
}

class Parser {
  i = 0;
  constructor(private toks: Tok[]) {}
  peek() {
    return this.toks[this.i];
  }
  next() {
    return this.toks[this.i++];
  }
  parseOr(): Node {
    let a = this.parseAnd();
    while (this.peek()?.k === "op" && OPS[this.peek()?.v ?? ""] === "or") {
      this.next();
      a = { t: "or", a, b: this.parseAnd() };
    }
    return a;
  }
  parseAnd(): Node {
    let a = this.parseNot();
    while (this.peek()?.k === "op" && OPS[this.peek()?.v ?? ""] === "and") {
      this.next();
      a = { t: "and", a, b: this.parseNot() };
    }
    return a;
  }
  parseNot(): Node {
    const t = this.peek();
    if (t?.k === "op" && OPS[t.v] === "not") {
      this.next();
      return { t: "not", a: this.parseNot() };
    }
    return this.parsePrimary();
  }
  parsePrimary(): Node {
    const t = this.next();
    if (!t) throw new FilterError("Filter ends unexpectedly", Infinity);
    if (t.k === "lp") {
      const n = this.parseOr();
      const r = this.next();
      if (r?.k !== "rp") throw new FilterError(`Missing ")"`, r?.pos ?? Infinity);
      return n;
    }
    if (t.k !== "word") throw new FilterError(`Expected a field name but found "${t.v}"`, t.pos);
    const name = t.v.toLowerCase();
    if (!FIELD_MAP.has(name)) throw new FilterError(`"${t.v}" is not a known field or protocol`, t.pos);
    const opTok = this.peek();
    const op = opTok?.k === "op" ? OPS[opTok.v] : undefined;
    if (!opTok || !op || op === "and" || op === "or" || op === "not") return { t: "exists", f: name };
    this.next();
    const valTok = this.next();
    if (!valTok || (valTok.k !== "word" && valTok.k !== "str"))
      throw new FilterError(`Expected a value after "${opTok.v}"`, valTok?.pos ?? Infinity);
    const def = FIELD_MAP.get(name);
    if (def?.type === "proto") throw new FilterError(`"${name}" is a protocol; compare one of its fields instead`, t.pos);
    if ((op === ">" || op === "<" || op === ">=" || op === "<=") && def && def.type !== "num")
      throw new FilterError(`"${name}" can't be compared with ${opTok.v}`, opTok.pos);
    return { t: "cmp", f: name, op, lit: makeLiteral(valTok.v, valTok.k === "str", op) };
  }
}

function eqValue(v: FieldValue, lit: Literal): boolean {
  if (typeof v === "number") return lit.num !== null ? v === lit.num : String(v) === lit.raw;
  if (lit.cidr) {
    const n = ipv4ToInt(v);
    return n !== null && ((n & lit.cidr.mask) >>> 0) === lit.cidr.base;
  }
  return v.toLowerCase() === lit.lower.replace(/-/g, (m) => (/^[0-9a-f]{2}(-[0-9a-f]{2}){5}$/.test(lit.lower) ? ":" : m));
}

function cmpOne(v: FieldValue, op: Op, lit: Literal): boolean {
  switch (op) {
    case "==":
      return eqValue(v, lit);
    case "!=":
      return !eqValue(v, lit);
    case "contains":
      return String(v).toLowerCase().includes(lit.lower);
    case "matches":
      return lit.regex ? lit.regex.test(String(v)) : false;
    default: {
      const n = typeof v === "number" ? v : Number(v);
      const l = lit.num ?? Number(lit.raw);
      if (Number.isNaN(n) || Number.isNaN(l)) return false;
      if (op === ">") return n > l;
      if (op === "<") return n < l;
      if (op === ">=") return n >= l;
      return n <= l;
    }
  }
}

function evaluate(n: Node, p: Packet): boolean {
  switch (n.t) {
    case "or":
      return evaluate(n.a, p) || evaluate(n.b, p);
    case "and":
      return evaluate(n.a, p) && evaluate(n.b, p);
    case "not":
      return !evaluate(n.a, p);
    case "exists": {
      const vals = p.fields.get(n.f);
      if (!vals) return false;
      // Boolean flags exist on every packet of that protocol; treat bare flag names as "is set".
      if (FIELD_MAP.get(n.f)?.type === "bool") return vals.some((v) => v === 1);
      return true;
    }
    case "cmp": {
      const vals = p.fields.get(n.f);
      if (!vals || vals.length === 0) return false;
      // Like Wireshark: "!=" means no value equals; everything else matches if any value does.
      if (n.op === "!=") return vals.every((v) => cmpOne(v, "!=", n.lit));
      return vals.some((v) => cmpOne(v, n.op, n.lit));
    }
  }
}

export function compileFilter(text: string): FilterResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, empty: true, test: () => true };
  try {
    const toks = tokenize(trimmed);
    const parser = new Parser(toks);
    const ast = parser.parseOr();
    const rest = parser.peek();
    if (rest) throw new FilterError(`Unexpected "${rest.v}" — did you mean "and" / "or"?`, rest.pos);
    return { ok: true, empty: false, test: (p) => evaluate(ast, p) };
  } catch (e) {
    if (e instanceof FilterError) return { ok: false, error: e.message };
    return { ok: false, error: "Invalid filter" };
  }
}

/** Builds a filter clause for a field value, quoting strings when needed. */
export function filterClause(field: string, value: FieldValue): string {
  if (typeof value === "number") return `${field} == ${value}`;
  if (/^[A-Za-z0-9_.:\-/]+$/.test(value)) return `${field} == ${value}`;
  return `${field} == "${value.replace(/"/g, '\\"')}"`;
}

export const FILTER_EXAMPLES: { filter: string; label: string }[] = [
  { filter: "http", label: "Web traffic (HTTP)" },
  { filter: "dns", label: "Name lookups" },
  { filter: "tls.handshake.type == 1", label: "TLS Client Hellos" },
  { filter: "tcp.flags.syn and not tcp.flags.ack", label: "New TCP connections" },
  { filter: "tcp.flags.reset", label: "Reset connections" },
  { filter: "ip.addr == 192.168.0.0/16", label: "Local network (CIDR)" },
  { filter: 'dns.qry.name contains "google"', label: "Lookups containing a word" },
  { filter: "frame.len > 1000", label: "Large frames" },
  { filter: "arp or icmp", label: "ARP and ping" },
];
