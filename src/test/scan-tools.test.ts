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

import { explainPasted, nmapOptions, optionArgs, profileCommand, toggleOption } from '@/lib/scan/options';
import { nseScripts, scriptsFor } from '@/lib/scan/knowledge';

describe('Scan simulator options', () => {
  it('keeps only one timing template and one port selection at a time', () => {
    let c = toggleOption([], '-T2'); c = toggleOption(c, '-T4');
    expect(c.map(x => x.flag)).toEqual(['-T4']);
    c = toggleOption(c, '-F'); c = toggleOption(c, '-p-');
    expect(c.map(x => x.flag)).toEqual(['-T4', '-p-']);
  });
  it('builds arguments with values and glued ping options, dropping unsafe characters', () => {
    expect(optionArgs([{ flag: '-p', value: '22,80; rm -rf' }, { flag: '-PS', value: '22,80' }, { flag: '-sV' }])).toEqual(['-p "22,80 rm -rf"', '-PS22,80', '-sV']);
    expect(optionArgs([{ flag: '--max-rate', value: '' }])).toEqual([]);
  });
  it('warns when XML output is missing and when -T5 or -sn conflicts are used', () => {
    expect(profileCommand(false, '-sS', []).warnings.some(w => w.includes('-oX'))).toBe(true);
    expect(profileCommand(false, '-sS', [{ flag: '-T5' }, { flag: '-oX', value: 'a.xml' }]).warnings).toEqual(['-T5 can miss open ports on slower networks.']);
    expect(profileCommand(false, '-sn', [{ flag: '-p', value: '80' }, { flag: '-oX', value: 'a.xml' }]).warnings[0]).toContain('ignored');
  });
  it('knows UDP scans need admin rights and are slow', () => {
    const p = profileCommand(true, '-sU', [{ flag: '-p-' }]);
    expect(p.needsRoot).toBe(true); expect(p.speed).toBe('Slow');
  });
  it('explains a pasted command and flags unknown options', () => {
    const rows = explainPasted('sudo nmap -sS -p- -T4 -PS22,80 --bogus 10.0.0.5');
    expect(rows.find(r => r.arg === '-sS')?.meaning).toBe('SYN scan.');
    expect(rows.find(r => r.arg === '-PS22,80')?.known).toBe(true);
    expect(rows.find(r => r.arg === '--bogus')?.known).toBe(false);
  });
  it('has unique option flags and unique script ids', () => {
    const flags = nmapOptions.map(o => o.flag); expect(new Set(flags).size).toBe(flags.length);
    const ids = nseScripts.map(s => s.id); expect(new Set(ids).size).toBe(ids.length);
  });
  it('hides brute-force, exploit and DoS scripts unless asked', () => {
    const safe = scriptsFor(['ssh', 'microsoft-ds'], false).map(s => s.id);
    expect(safe).not.toContain('ssh-brute'); expect(safe).not.toContain('smb-vuln-ms08-067');
    expect(scriptsFor(['ssh'], true).map(s => s.id)).toContain('ssh-brute');
  });
});
