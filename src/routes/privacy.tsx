import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';

const title = 'Privacy and cookie choices — Pktivo';
const description = 'How Pktivo keeps packet captures in your browser tab, remembers your preferences, and handles privacy-friendly visit measurement.';

export const Route = createFileRoute('/privacy')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://pktivo.com/privacy' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://pktivo.com/privacy' }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2 font-semibold"><PktivoLogo className="size-7 text-primary" />pktivo.</Link>
      <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft />Packet viewer</Link></Button>
    </div></header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="size-4" />Privacy</div>
      <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Privacy and cookie choices</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">Pktivo is designed so your network captures remain yours. This page separates temporary capture analysis from the small set of site preferences and visit measurements.</p>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">Your packet captures</h2>
        <p className="mt-3 leading-7 text-muted-foreground">PCAP and PCAPNG files are read locally in your browser tab. Capture contents, decoded packets, comparison results, marks, notes and saved packet filters are not uploaded or added to persistent browser storage. They are cleared when the tab closes and when the page is removed from the browser’s back/forward cache. The original file on your device is not changed or deleted.</p>
        <p className="mt-3 leading-7 text-muted-foreground">Pktivo does not perform online lookups of captured addresses or website names. Capture analysis and warning detection run in your browser.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">Preferences stored on your device</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Your browser can store your selected theme, completed learning modules, your choice about the AI-built notice, and your analytics consent choice. These preferences contain no packet data. An accepted analytics choice is kept for up to 12 months; a refusal is asked again after 183 days. You can change the choice through Cookie settings without clearing capture data or reloading.</p>
        <p className="mt-3 leading-7 text-muted-foreground">Pktivo’s hosting sets a strictly necessary cookie needed to deliver the site. The consent panel does not list or disable this necessary cookie.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">Lovable visitor analytics</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Lovable’s analytics uses no cookies, stores nothing on your device, does not keep IP addresses and does not identify visitors. It records pages visited, where visitors came from, country, browser, operating system, device type, time on page, page loading speed and errors. With click measurement allowed, it also records button and link clicks.</p>
        <p className="mt-3 leading-7 text-muted-foreground">Clicks are recorded only after analytics is accepted. If analytics is rejected, or your browser sends Global Privacy Control, clicks are not recorded—even if an earlier choice accepted them. Page visits, time on page, page speed and errors are recorded for every visitor, without cookies and without identifying anyone.</p>
        <p className="mt-3 leading-7 text-muted-foreground">Detailed data is kept for 90 days and daily summaries for a year. Lovable collects this data for us. <a href="https://lovable.dev/privacy" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Lovable’s privacy policy</a> explains how it handles it.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">Lesson suggestions</h2>
        <p className="mt-3 leading-7 text-muted-foreground">When practice results request Lessons to revisit, Lovable’s AI Gateway and its model provider process the missed practice questions, selected and correct answers, and relevant lesson identifiers to produce study suggestions. Packet captures and decoded packet data are never included in these requests.</p>
      </section>

      <section className="mt-10 border-t pt-8"><h2 className="text-2xl font-semibold">Your controls</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Use the Cookie settings button to accept, reject or change analytics measurement. Global Privacy Control is treated as a rejection. No advertising tags, advertising cookies, social media pixels or sign-in tracking are used on this site.</p>
      </section>
    </main>
    <footer className="border-t px-4 py-6 text-center"><PktivoPronunciation className="text-xs" /></footer>
  </div>;
}
