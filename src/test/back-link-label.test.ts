import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROUTES_DIR = join(process.cwd(), 'src', 'routes');

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(full);
    return entry.isFile() && /\.tsx?$/.test(entry.name) && entry.name !== 'routeTree.gen.ts'
      ? [full]
      : [];
  });
}

// Every page that returns to the workspace must use one identical label, so people
// learning on one page can find their way back from any other page.
describe('Back-to-workspace link label', () => {
  const backLinks = routeFiles(ROUTES_DIR).flatMap(file => {
    const source = readFileSync(file, 'utf8');
    const labels = [...source.matchAll(/<Link to="\/packet-analyzer"><ArrowLeft \/>([^<]+)<\/Link>/g)].map(
      match => match[1],
    );
    return labels.map(label => ({ file: file.slice(process.cwd().length + 1), label }));
  });

  it('finds the back link on every page that offers one', () => {
    expect(backLinks.length).toBeGreaterThanOrEqual(4);
    expect(backLinks.map(b => b.file)).toEqual(
      expect.arrayContaining([
        'src/routes/glossary.tsx',
        'src/routes/how-to-read-wireshark-capture.tsx',
        'src/routes/learn.tsx',
        'src/routes/pcap-file-analyzer-online.tsx',
      ]),
    );
  });

  it('uses "Packet viewer" everywhere instead of varying names', () => {
    expect(backLinks.map(b => `${b.file}: ${b.label}`)).toEqual(
      backLinks.map(b => `${b.file}: Packet viewer`),
    );
  });
});
