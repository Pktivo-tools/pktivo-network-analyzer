import { describe, expect, it } from 'vitest';
import {
  BUILDER_GROUPS,
  allGroups,
  buildFilter,
  contextGroup,
  selectionForFilter,
  type BuilderContext,
} from '@/lib/netlens/filter-builder';
import { compileFilter } from '@/lib/netlens/filter';

const context: BuilderContext = {
  addrA: '192.168.1.108',
  addrB: '93.184.216.34',
  website: 'example.com',
  stream: { kind: 'tcp', index: 3 },
};

describe('filter builder', () => {
  it('combines chips inside a group with "or" and between groups with "and"', () => {
    expect(buildFilter({ traffic: ['dns', 'http'] })).toBe('(dns or http)');
    expect(buildFilter({ traffic: ['dns'], outcome: ['reset'] })).toBe('(dns) and (tcp.flags.reset)');
    expect(buildFilter({})).toBe('');
  });
  it('writes every built filter as one the display filter engine accepts', () => {
    const built = buildFilter(
      { traffic: ['dns', 'tls'], direction: ['out'], outcome: ['new', 'failed-name'] },
      context,
    );
    const check = compileFilter(built);
    if (!check.ok) throw new Error(check.error);
    expect(built).toContain(' and ');
    expect(built).toContain(' or ');
  });
  it('offers every chip as a filter on its own', () => {
    for (const group of allGroups(context)) {
      for (const choice of group.choices) {
        const check = compileFilter(choice.filter);
        if (!check.ok) throw new Error(`${group.id}/${choice.id}: ${choice.filter} -> ${check.error}`);
      }
    }
  });
  it('only offers the conversation chip when both addresses are IPv4', () => {
    const group = contextGroup(context);
    expect(group?.choices.map((c) => c.id)).toEqual(['conversation', 'stream', 'website']);
    expect(contextGroup({ ...context, addrA: 'fe80::1' })?.choices.map((c) => c.id)).toEqual(['stream', 'website']);
    expect(contextGroup(null)).toBeNull();
  });
  it('round-trips a built filter back into the chips it came from', () => {
    const built = buildFilter({ traffic: ['dns', 'tls'], direction: ['in'] }, context);
    expect(selectionForFilter(built, context)).toEqual({ traffic: ['dns', 'tls'], direction: ['in'] });
  });
  it('keeps the built-in groups free of any capture data', () => {
    expect(BUILDER_GROUPS.map((g) => g.id)).toEqual(['traffic', 'direction', 'outcome']);
    expect(buildFilter({ traffic: ['http'], direction: ['local'] })).toContain('192.168.0.0/16');
  });
});
