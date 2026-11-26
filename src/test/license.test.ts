import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = process.cwd();
const license = readFileSync(join(root, 'LICENSE'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { license?: string };

// People reading the repository page need one clear answer to "may I use this,
// and how do I contribute?" - so the license file, the package metadata and the
// project page must all agree.
describe('Repository license', () => {
  it('ships the full Apache-2.0 text', () => {
    expect(license).toContain('Apache License');
    expect(license).toContain('Version 2.0');
    expect(license).toContain('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION');
    expect(license).toContain('Copyright 2026 Pktivo');
    expect(license).toContain('Licensed under the Apache License, Version 2.0');
    // A placeholder left behind would make the notice meaningless.
    expect(license).not.toContain('[yyyy]');
    expect(license).not.toContain('[name of copyright owner]');
  });

  it('declares the same license in package metadata', () => {
    expect(pkg.license).toBe('Apache-2.0');
  });

  it('points the project page at the license file', () => {
    const licenseSection = readme.slice(readme.indexOf('## License'));
    expect(licenseSection).toContain('Apache License, Version 2.0');
    expect(licenseSection).toContain('(LICENSE)');
    expect(licenseSection).not.toMatch(/no license file has been added/i);
  });
});
