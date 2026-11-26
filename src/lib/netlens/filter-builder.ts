import { filterClause } from "./filter";

export interface BuilderChoice {
  id: string;
  label: string;
  filter: string;
}

export interface BuilderGroup {
  id: string;
  label: string;
  hint: string;
  multi: boolean;
  choices: BuilderChoice[];
}

/** Details of the packet the builder was opened from, used for "focus" chips. */
export interface BuilderContext {
  addrA: string;
  addrB: string;
  website: string | null;
  stream: { kind: "tcp" | "udp"; index: number } | null;
}

export type BuilderSelection = Record<string, string[]>;

const LOCAL_DST =
  "(ip.dst == 10.0.0.0/8 or ip.dst == 172.16.0.0/12 or ip.dst == 192.168.0.0/16 or ip.dst == 127.0.0.0/8 or ip.dst == 169.254.0.0/16)";
const LOCAL_SRC = LOCAL_DST.replaceAll("ip.dst", "ip.src");
const isIPv4 = (a: string) => /^\d+\.\d+\.\d+\.\d+$/.test(a);

export const BUILDER_GROUPS: BuilderGroup[] = [
  {
    id: "traffic",
    label: "Traffic type",
    hint: "Pick one or more. Chosen types are combined with “or”.",
    multi: true,
    choices: [
      { id: "dns", label: "Name lookups", filter: "dns" },
      { id: "http", label: "Web (HTTP)", filter: "http" },
      { id: "tls", label: "Encrypted web (TLS)", filter: "tls" },
      { id: "quic", label: "QUIC", filter: "quic" },
      { id: "tcp", label: "TCP", filter: "tcp" },
      { id: "udp", label: "UDP", filter: "udp" },
      { id: "arp", label: "ARP", filter: "arp" },
      { id: "icmp", label: "Ping / ICMP", filter: "icmp" },
    ],
  },
  {
    id: "direction",
    label: "Direction",
    hint: "Pick one. Leave it empty to see both ways.",
    multi: false,
    choices: [
      { id: "out", label: "Going out to the internet", filter: `ip and not ${LOCAL_DST}` },
      { id: "in", label: "Coming in from the internet", filter: `ip and not ${LOCAL_SRC}` },
      { id: "local", label: "Inside my own network", filter: `${LOCAL_DST} and ${LOCAL_SRC}` },
    ],
  },
  {
    id: "outcome",
    label: "What happened",
    hint: "Pick one or more to narrow down to a problem.",
    multi: true,
    choices: [
      { id: "new", label: "Connection attempts", filter: "tcp.flags.syn and not tcp.flags.ack" },
      { id: "reset", label: "Cut short by a reset", filter: "tcp.flags.reset" },
      { id: "failed-name", label: "Name could not be found", filter: "dns.flags.response and dns.flags.rcode == 3" },
      { id: "no-room", label: "Receiver had no room", filter: "tcp.window_size == 0" },
      { id: "web-error", label: "Web errors (4xx / 5xx)", filter: "http.response.code >= 400" },
      { id: "large", label: "Large frames", filter: "frame.len > 1000" },
      { id: "small", label: "Small frames", filter: "frame.len <= 100" },
    ],
  },
];

/** Chips that only make sense when a packet is already selected. */
export function contextGroup(ctx: BuilderContext | null): BuilderGroup | null {
  if (!ctx) return null;
  const choices: BuilderChoice[] = [];
  if (isIPv4(ctx.addrA) && isIPv4(ctx.addrB)) {
    choices.push({
      id: "conversation",
      label: `Only ${ctx.addrA} and ${ctx.addrB}`,
      filter: `ip.addr == ${ctx.addrA} and ip.addr == ${ctx.addrB}`,
    });
  }
  if (ctx.stream) {
    choices.push({
      id: "stream",
      label: `Only this conversation (stream ${ctx.stream.index})`,
      filter: `${ctx.stream.kind}.stream == ${ctx.stream.index}`,
    });
  }
  if (ctx.website) {
    const name = ctx.website;
    choices.push({
      id: "website",
      label: `Only traffic for ${name}`,
      filter: `${filterClause("dns.qry.name", name)} or ${filterClause("tls.handshake.extensions_server_name", name)} or ${filterClause("http.host", name)}`,
    });
  }
  if (!choices.length) return null;
  return {
    id: "focus",
    label: "Focus",
    hint: "Narrow everything down to the packet you are looking at.",
    multi: true,
    choices,
  };
}

export function allGroups(ctx: BuilderContext | null): BuilderGroup[] {
  const extra = contextGroup(ctx);
  return extra ? [...BUILDER_GROUPS, extra] : BUILDER_GROUPS;
}

export function emptySelection(): BuilderSelection {
  return {};
}

/** Combines the chosen chips: “or” inside a group, “and” between groups. */
export function buildFilter(selection: BuilderSelection, ctx: BuilderContext | null = null): string {
  const parts: string[] = [];
  for (const group of allGroups(ctx)) {
    const ids = selection[group.id] ?? [];
    if (!ids.length) continue;
    const filters = ids
      .map((id) => group.choices.find((c) => c.id === id)?.filter)
      .filter((f): f is string => !!f);
    if (!filters.length) continue;
    parts.push(group.multi || filters.length === 1 ? `(${filters.join(" or ")})` : filters[0] ?? "");
  }
  return parts.join(" and ");
}

/** Which chips a filter string already contains, so the builder can show it. */
export function selectionForFilter(filter: string, ctx: BuilderContext | null = null): BuilderSelection {
  const selection: BuilderSelection = {};
  const text = filter.trim();
  if (!text) return selection;
  for (const group of allGroups(ctx)) {
    const ids = group.choices.filter((c) => text.includes(c.filter)).map((c) => c.id);
    const first = ids[0];
    if (group.multi) {
      if (ids.length) selection[group.id] = ids;
    } else if (first) selection[group.id] = [first];
  }
  return selection;
}
