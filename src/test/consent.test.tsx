import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { CookieConsent } from '@/components/cookie-consent';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('Cookie consent', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No region lookup in tests')));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'globalPrivacyControl');
  });

  it('remembers rejection and lets the visitor grant analytics later', async () => {
    render(<CookieConsent />);
    const panel = await screen.findByRole('region', { name: 'Your privacy choices' });
    await waitFor(() => expect(panel).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Reject all' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Your privacy choices' })).not.toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem('cookie_consent_analytics') ?? '{}').choice).toBe('denied');

    fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    const toggle = await screen.findByRole('switch', { name: 'Analytics, provided by Lovable' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Save choices' }));

    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('cookie_consent_analytics') ?? '{}').choice).toBe('granted'));
    expect(screen.queryByRole('region', { name: 'Your privacy choices' })).not.toBeInTheDocument();
  });

  it('honors Global Privacy Control over a stored acceptance', async () => {
    window.localStorage.setItem('cookie_consent_analytics', JSON.stringify({ choice: 'granted', at: Date.now() }));
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
    render(<CookieConsent />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });

    expect(screen.queryByRole('region', { name: 'Your privacy choices' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    const toggle = await screen.findByRole('switch', { name: 'Analytics, provided by Lovable' });
    expect(toggle).not.toBeChecked();
    expect(toggle).toBeDisabled();
  });

  it('accepts all from settings and restores the saved preference after reopening', async () => {
    render(<CookieConsent />);
    await screen.findByRole('region', { name: 'Your privacy choices' });
    fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept all' }));
    expect(JSON.parse(window.localStorage.getItem('cookie_consent_analytics') ?? '{}').choice).toBe('granted');
    cleanup();

    render(<CookieConsent />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cookie settings' }));
    expect(await screen.findByRole('switch', { name: 'Analytics, provided by Lovable' })).toBeChecked();
  });

  it('saves the chosen off preference instead of accepting all', async () => {
    render(<CookieConsent />);
    await screen.findByRole('region', { name: 'Your privacy choices' });
    fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save choices' }));
    expect(JSON.parse(window.localStorage.getItem('cookie_consent_analytics') ?? '{}').choice).toBe('denied');
    fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    expect(await screen.findByRole('switch', { name: 'Analytics, provided by Lovable' })).not.toBeChecked();
  });
});
