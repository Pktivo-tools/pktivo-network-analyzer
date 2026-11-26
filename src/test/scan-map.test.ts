import { describe, expect, it } from 'vitest';
import { diffScans, filterHosts, parseNmapXml, subnetOf, NmapXmlError } from '@/lib/scan/nmap-xml';
import { demoScanAfter, demoScanBefore } from '@/lib/scan/demo';
import { buildCommand, scriptsFor } from '@/lib/scan/knowledge';

describe('Scan Map', () => {
  it('parses hosts, ports and OS from Nmap XML', () => {
    const s = parseNmapXml(demoScanBefore);
    expect(s.hosts).toHaveLength(4);
    expect(s.hosts[0]?.hostname).toBe('router.lan');
    expect(s.hosts[0]?.ports.map(p => p.port)).toEqual([53, 80, 443]);
    expect(s.hosts[0]?.os).toBe('Linux 4.15 - 5.19');
  });
  it('rejects non-Nmap files', () => { expect(() => parseNmapXml('<a/>')).toThrow(NmapXmlError); expect(() => parseNmapXml('nope')).toThrow(NmapXmlError); });
  it('groups by /24', () => expect(subnetOf('10.0.5.11')).toBe('10.0.5.0/24'));
  it('filters by open port', () => expect(filterHosts(parseNmapXml(demoScanBefore).hosts, { text: '', port: '22', onlyUp: true }).map(h => h.address)).toEqual(['192.168.1.20', '192.168.1.50']));
  it('finds new port, new host, gone host and version change', () => {
    const d = diffScans(parseNmapXml(demoScanBefore), parseNmapXml(demoScanAfter));
    expect(d).toContainEqual(expect.objectContaining({ kind: 'new-port', host: '192.168.1.1', port: 23 }));
    expect(d).toContainEqual(expect.objectContaining({ kind: 'new-host', host: '10.0.5.10' }));
    expect(d).toContainEqual(expect.objectContaining({ kind: 'gone-host', host: '192.168.1.50' }));
    expect(d).toContainEqual(expect.objectContaining({ kind: 'changed-service', port: 53 }));
    expect(d).toContainEqual(expect.objectContaining({ kind: 'closed-port', host: '192.168.1.35', port: 139 }));
  });
  it('builds a command and strips shell characters from the target', () => expect(buildCommand('-sS', ['-sV'], '10.0.0.1; rm -rf')).toBe('nmap -sS -sV 10.0.0.1 rm -rf'));
  it('hides brute-force scripts unless allowed', () => {
    expect(scriptsFor(['ssh'], false).map(s => s.id)).not.toContain('ssh-brute');
    expect(scriptsFor(['ssh'], true).map(s => s.id)).toContain('ssh-brute');
  });
});
