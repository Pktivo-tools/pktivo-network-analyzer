import { describe, expect, it } from 'vitest';
import { readLearnProgress, saveLearnProgress } from '@/lib/learn/progress';

describe('saved Learn progress', () => {
  it('saves subnetting completion separately from the existing course modules', () => {
    let saved = '';
    const storage = { getItem: () => saved || null, setItem: (_key: string, value: string) => { saved = value; } };
    saveLearnProgress(storage, new Set(['subnet-ipv4', 'subnet-vlsm', 'subnet-capstone', 'subnet-ipv6', 'what-is-network', 'private-capture']));
    expect([...readLearnProgress(storage)]).toEqual(['subnet-ipv4', 'subnet-vlsm', 'subnet-capstone', 'subnet-ipv6', 'what-is-network']);
  });
  it('keeps completed modules when the tab closes and a new visit reads storage', () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    expect(saveLearnProgress(storage, new Set(['what-is-network', 'osi-tcpip']))).toBe(true);
    expect([...readLearnProgress(storage)]).toEqual(['what-is-network', 'osi-tcpip']);
    expect([...data.keys()]).toEqual(['pktivo.learn.progress.v1']);
  });
  it('only persists valid completed module IDs, never capture data', () => {
    let saved = '';
    saveLearnProgress({ getItem: () => null, setItem: (_key, value) => { saved = value; } }, new Set(['what-is-network', 'packet-payload']));
    expect(JSON.parse(saved)).toEqual(['what-is-network']);
  });
  it('ignores invalid, removed and duplicate stored module IDs', () => {
    expect([...readLearnProgress({ getItem: () => '["osi-tcpip","removed",42,"osi-tcpip"]', setItem: () => {} })]).toEqual(['osi-tcpip']);
    expect(readLearnProgress({ getItem: () => '{broken', setItem: () => {} }).size).toBe(0);
  });
  it('reports unavailable saving without crashing the lesson', () => {
    const storage = { getItem: () => { throw new Error('Blocked'); }, setItem: () => { throw new Error('Blocked'); } };
    expect(readLearnProgress(storage).size).toBe(0);
    expect(saveLearnProgress(storage, new Set(['what-is-network']))).toBe(false);
  });
});