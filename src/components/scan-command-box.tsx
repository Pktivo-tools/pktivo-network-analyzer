import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CommandBox({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="mt-4 flex items-center gap-2 rounded-md border bg-muted p-2"><code className="min-w-0 flex-1 break-all font-mono text-sm" aria-label="Generated command">{cmd}</code><Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy />{copied ? 'Copied' : 'Copy'}</Button></div>;
}
