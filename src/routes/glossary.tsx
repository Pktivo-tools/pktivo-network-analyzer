import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, BookOpen, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PktivoLogo } from '@/components/pktivo-logo';
import { PktivoPronunciation } from '@/components/pktivo-pronunciation';
import { findGlossaryTerms, glossaryCategories, glossaryTerms, type GlossaryCategory } from '@/lib/learn/glossary';

export const Route = createFileRoute('/glossary')({
  staticData: { sitemap: true },
  head: () => ({ meta: [
    { title: 'Wireshark and networking glossary — Pktivo' },
    { name: 'description', content: 'Plain-language definitions and examples of Wireshark and networking terms, including packets, TCP, DNS, subnetting, capture filters and response times.' },
    { property: 'og:title', content: 'Wireshark and networking glossary — Pktivo' },
    { property: 'og:description', content: 'Understand packet captures and CCNA networking vocabulary with a searchable, beginner-friendly glossary.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: GlossaryPage,
});

function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'All'>('All');
  const terms = findGlossaryTerms(query, category);
  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-8"><Link to="/" className="flex items-center gap-2 font-semibold"><span className="size-6"><PktivoLogo /></span>pktivo<span className="text-primary">.</span></Link><Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft />Back to packet viewer</Link></Button></header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-2 text-sm text-primary"><BookOpen className="size-4" />Networking reference</div>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Wireshark & networking glossary</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">The words behind the packets, explained in plain language with a small example for each.</p>
      <div className="mt-6 flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link to="/learn">Networking course</Link></Button><Button asChild variant="ghost" size="sm"><Link to="/learn/subnetting">Subnetting course</Link></Button><Button asChild variant="ghost" size="sm"><Link to="/learn/test">Practice test →</Link></Button></div>
      <div className="mt-8 border-y py-5"><label htmlFor="term-search" className="text-sm font-medium">Find a term</label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="term-search" type="text" inputMode="search" placeholder="TCP, subnet mask, display filter…" className="pl-9 pr-10" value={query} onChange={e => setQuery(e.target.value)} />{query && <Button size="icon" variant="ghost" className="absolute right-1 top-1 size-7" aria-label="Clear glossary search" onClick={() => setQuery('')}><X /></Button>}</div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Term categories">{(['All', ...glossaryCategories] as const).map(c => <Button key={c} size="sm" variant={c === category ? 'secondary' : 'ghost'} aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</Button>)}</div>
      </div>
      <p role="status" className="mt-4 text-xs text-muted-foreground">{terms.length} of {glossaryTerms.length} terms</p>
      <dl className="mt-4 divide-y">{terms.map(term => <div key={term.name} className="grid gap-3 py-6 sm:grid-cols-[13rem_1fr] sm:gap-6"><dt><span className="block text-lg font-medium">{term.name}</span><span className="mt-1 block text-xs text-primary">{term.category}</span></dt><dd className="min-w-0"><p className="text-sm leading-7">{term.meaning}</p><p className="mt-2 border-l-2 border-border pl-3 text-sm leading-6 text-muted-foreground"><span className="font-medium">Example: </span>{term.example}</p></dd></div>)}</dl>
      {!terms.length && <div className="py-12 text-center"><h2 className="font-medium">No matching terms</h2><Button className="mt-4" variant="outline" onClick={() => { setQuery(''); setCategory('All'); }}>Show all terms</Button></div>}
      <footer className="mt-8 border-t pt-6"><PktivoPronunciation className="text-xs" /><p className="mt-2 text-xs text-muted-foreground">Independent educational reference. Warnings are clues, not proof; always consider capture settings and context.</p></footer>
    </main>
  </div>;
}