import { describe, expect, it } from 'vitest';
import { parseNmapXml } from '@/lib/scan/nmap-xml';
import { demoScanAfter } from '@/lib/scan/demo';
import { liveHostList, lookupPorts, nextSteps, recipeCommand, recipes, scanToCsv, serviceInventory } from '@/lib/scan/tools';

const scan = parseNmapXml(demoScanAfter);

describe('Scan Map tools', () => {
  it('groups open ports by service across hosts', () => {
    const rows = serviceInventory(scan);
    const total = scan.hosts.reduce((n, h) => n + h.ports.filter(p => p.state === 'open').length, 0);
    expect(rows.reduce((n, r) => n + r.hosts.length, 0)).toBe(total);
  });
  it('neutralises spreadsheet formulas in CSV export', () => {
    const s = parseNmapXml(demoScanAfter); s.hosts[0]!.hostname = '=HYPERLINK("x")';
    expect(scanToCsv(s)).toContain(`"'=HYPERLINK(""x"")"`);
  });
  it('lists only hosts that are up', () => {
    const up = scan.hosts.filter(h => h.status === 'up').length;
    expect(liveHostList(scan).trim().split('\n')).toHaveLength(up);
  });
  it('suggests UDP when the scan had no -sU', () => {
    expect(nextSteps({ ...scan, args: 'nmap -sV 10.0.0.0/24' }).some(s => s.command.includes('-sU'))).toBe(true);
    expect(nextSteps({ ...scan, args: 'nmap -sV -sU 10.0.0.0/24' }).some(s => s.command.includes('-sU'))).toBe(false);
  });
  it('recipe commands save XML, need sudo when root is required, and strip shell characters', () => {
    const udp = recipes.find(r => r.id === 'udp')!;
    expect(recipeCommand(udp, '10.0.0.1; rm -rf /')).toBe('sudo nmap -sU --top-ports 20 -oX scan.xml 10.0.0.1 rm -rf /');
    expect(recipeCommand(recipes[0]!, '')).toBe('nmap -sn -oX scan.xml 192.168.1.0/24');
  });
  it('looks up ports by number and name', () => {
    expect(lookupPorts('3389')[0]?.service).toBe('ms-wbt-server');
    expect(lookupPorts('redis').map(p => p.port)).toEqual([6379]);
  });
});
