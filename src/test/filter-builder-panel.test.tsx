import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FilterBuilder } from '@/components/filter-builder';

const context = {
  addrA: '192.168.1.108',
  addrB: '93.184.216.34',
  website: 'example.com',
  stream: { kind: 'tcp' as const, index: 3 },
};

const built = () => (screen.getByLabelText('Built filter') as HTMLInputElement).value;
const chip = (group: string, name: string) =>
  within(screen.getByRole('heading', { name: group }).parentElement as HTMLElement).getByRole('button', { name });

const renderPanel = () =>
  render(
    <FilterBuilder
      context={context}
      applied=""
      saved={[]}
      onSave={vi.fn()}
      onDelete={vi.fn()}
      onApply={vi.fn()}
    />,
  );

describe('filter builder panel', () => {
  it('writes a working filter as choices are clicked and keeps earlier choices', () => {
    renderPanel();
    fireEvent.click(chip('Traffic type', 'Name lookups'));
    expect(built()).toBe('(dns)');
    fireEvent.click(chip('What happened', 'Cut short by a reset'));
    expect(built()).toBe('(dns) and (tcp.flags.reset)');
    fireEvent.click(chip('Traffic type', 'Name lookups'));
    expect(built()).toBe('(tcp.flags.reset)');
  });
  it('keeps a typed filter until the chips are used again', () => {
    renderPanel();
    fireEvent.click(chip('Traffic type', 'Name lookups'));
    fireEvent.change(screen.getByLabelText('Built filter'), { target: { value: 'dns.flags.response' } });
    expect(built()).toBe('dns.flags.response');
    fireEvent.click(chip('Traffic type', 'ARP'));
    expect(built()).toBe('(dns or arp)');
  });
});
