import { describe, expect, it } from 'vitest';
import { demoPackets } from '@/lib/netlens/demo';
import { buildTree } from '@/lib/netlens/dissect';
import { nodeAtOffset } from '@/components/netlens-inspector';
describe('byte selection',()=>{it('picks the deepest field covering a byte',()=>{const p=demoPackets()[4];if(!p)throw new Error();const n=nodeAtOffset(buildTree(p),26);expect(n?.field).toBe('ip.src');});});
