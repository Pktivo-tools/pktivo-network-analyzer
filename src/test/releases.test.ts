import { describe, expect, it } from 'vitest';
import { RELEASES, RELEASE_VERSION } from '@/lib/netlens/releases';
describe('Requested desktop distribution targets',()=>{
  it('includes Windows, both Mac architectures, Debian/Ubuntu and Arch',()=>{expect(RELEASES.map(r=>r.id)).toEqual(['windows','mac-arm','mac-intel','debian','arch']);expect(RELEASE_VERSION).toBe('0.3.0')});
  it('uses uploaded nonempty native packages for Debian and Arch',()=>{expect(RELEASES.find(r=>r.id==='debian')?.asset.original_filename).toMatch(/\.deb$/);expect(RELEASES.find(r=>r.id==='arch')?.asset.original_filename).toMatch(/\.pkg\.tar\.zst$/);for(const r of RELEASES){expect(r.asset.size).toBeGreaterThan(80000000);expect(r.asset.url).toMatch(/^\/__l5e\/assets-v1\//)}});
});