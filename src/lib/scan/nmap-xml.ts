// Browser-local Nmap XML (-oX) reader. Nothing leaves the device.
export type PortState = 'open' | 'closed' | 'filtered' | 'open|filtered' | 'closed|filtered' | 'unfiltered';
export interface ScanPort { protocol: string; port: number; state: string; reason: string; service: string; product: string; version: string; scripts: { id: string; output: string }[] }
export interface ScanHost { address: string; mac: string; vendor: string; hostname: string; status: string; os: string; osAccuracy: number; ports: ScanPort[]; hostScripts: { id: string; output: string }[] }
export interface NmapScan { args: string; startedAt: string; version: string; scanTypes: string[]; hosts: ScanHost[]; elapsed: string; summary: string }

export class NmapXmlError extends Error {}

const attr = (el: Element | null | undefined, n: string) => el?.getAttribute(n) ?? '';
const scripts = (el: Element) => Array.from(el.children).filter(c => c.tagName === 'script').map(s => ({ id: attr(s, 'id'), output: attr(s, 'output').trim() }));

export function parseNmapXml(text: string): NmapScan {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new NmapXmlError('This file is not valid XML. Save the scan with nmap -oX file.xml.');
  const run = doc.getElementsByTagName('nmaprun')[0];
  if (!run) throw new NmapXmlError('This XML is not an Nmap result. Save the scan with nmap -oX file.xml.');
  const hosts: ScanHost[] = Array.from(run.getElementsByTagName('host')).map(h => {
    const addrs = Array.from(h.getElementsByTagName('address'));
    const ip = addrs.find(a => attr(a, 'addrtype') !== 'mac');
    const mac = addrs.find(a => attr(a, 'addrtype') === 'mac');
    const osMatch = Array.from(h.getElementsByTagName('osmatch')).sort((a, b) => Number(attr(b, 'accuracy')) - Number(attr(a, 'accuracy')))[0];
    const ports = Array.from(h.getElementsByTagName('port')).map(p => {
      const s = p.getElementsByTagName('state')[0]; const sv = p.getElementsByTagName('service')[0];
      return { protocol: attr(p, 'protocol'), port: Number(attr(p, 'portid')), state: attr(s, 'state'), reason: attr(s, 'reason'), service: attr(sv, 'name'), product: attr(sv, 'product'), version: [attr(sv, 'version'), attr(sv, 'extrainfo')].filter(Boolean).join(' '), scripts: scripts(p) };
    }).sort((a, b) => a.port - b.port);
    const hs = h.getElementsByTagName('hostscript')[0];
    return { address: attr(ip ?? mac, 'addr'), mac: attr(mac, 'addr'), vendor: attr(mac, 'vendor'), hostname: attr(h.getElementsByTagName('hostname')[0], 'name'), status: attr(h.getElementsByTagName('status')[0], 'state') || 'up', os: attr(osMatch, 'name'), osAccuracy: Number(attr(osMatch, 'accuracy')) || 0, ports, hostScripts: hs ? scripts(hs) : [] };
  }).filter(h => h.address);
  const fin = run.getElementsByTagName('finished')[0];
  return { args: attr(run, 'args'), startedAt: attr(run, 'startstr'), version: attr(run, 'version'), scanTypes: Array.from(run.getElementsByTagName('scaninfo')).map(s => `${attr(s, 'type')}/${attr(s, 'protocol')}`), hosts, elapsed: attr(fin, 'elapsed'), summary: attr(fin, 'summary') };
}

export const openPorts = (h: ScanHost) => h.ports.filter(p => p.state === 'open');

/** Group hosts by IPv4 /24 (or IPv6 /64-ish prefix) for the topology map. */
export function subnetOf(address: string): string {
  if (address.includes('.')) return address.split('.').slice(0, 3).join('.') + '.0/24';
  if (address.includes(':')) return address.split(':').slice(0, 4).join(':') + '::/64';
  return 'other';
}
export function groupBySubnet(hosts: ScanHost[]): Map<string, ScanHost[]> {
  const m = new Map<string, ScanHost[]>();
  for (const h of hosts) { const k = subnetOf(h.address); m.set(k, [...(m.get(k) ?? []), h]); }
  return m;
}

export interface HostFilter { text: string; onlyUp: boolean; port: string }
export function filterHosts(hosts: ScanHost[], f: HostFilter): ScanHost[] {
  const q = f.text.trim().toLowerCase(); const port = Number(f.port);
  return hosts.filter(h => (!f.onlyUp || h.status === 'up')
    && (!f.port || openPorts(h).some(p => p.port === port))
    && (!q || [h.address, h.hostname, h.os, h.vendor, ...h.ports.flatMap(p => [p.service, p.product, String(p.port)])].some(v => v.toLowerCase().includes(q))));
}

export type DiffKind = 'new-host' | 'gone-host' | 'new-port' | 'closed-port' | 'changed-service';
export interface DiffItem { kind: DiffKind; host: string; port?: number; protocol?: string; before?: string; after?: string }
const svc = (p: ScanPort) => [p.service, p.product, p.version].filter(Boolean).join(' ');
export function diffScans(before: NmapScan, after: NmapScan): DiffItem[] {
  const out: DiffItem[] = [];
  const a = new Map(before.hosts.map(h => [h.address, h])); const b = new Map(after.hosts.map(h => [h.address, h]));
  for (const [ip, h] of b) {
    const old = a.get(ip);
    if (!old) { out.push({ kind: 'new-host', host: ip, after: openPorts(h).map(p => p.port).join(', ') || 'no open ports' }); continue; }
    const oldOpen = new Map(openPorts(old).map(p => [`${p.protocol}/${p.port}`, p]));
    const newOpen = new Map(openPorts(h).map(p => [`${p.protocol}/${p.port}`, p]));
    for (const [k, p] of newOpen) { const o = oldOpen.get(k); if (!o) out.push({ kind: 'new-port', host: ip, port: p.port, protocol: p.protocol, after: svc(p) }); else if (svc(o) !== svc(p)) out.push({ kind: 'changed-service', host: ip, port: p.port, protocol: p.protocol, before: svc(o), after: svc(p) }); }
    for (const [k, p] of oldOpen) if (!newOpen.has(k)) out.push({ kind: 'closed-port', host: ip, port: p.port, protocol: p.protocol, before: svc(p) });
  }
  for (const ip of a.keys()) if (!b.has(ip)) out.push({ kind: 'gone-host', host: ip });
  return out;
}
