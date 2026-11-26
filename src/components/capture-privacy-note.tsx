import { LockKeyhole } from 'lucide-react';
import { GitHubLink } from '@/components/github-link';
export function CapturePrivacyNote(){
  return <div className="mx-4 mb-4 flex flex-wrap items-start gap-x-2 gap-y-1 text-xs leading-5 text-muted-foreground sm:mx-6"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-primary"/><p className="min-w-0 flex-1"><strong className="font-medium text-foreground">Local, not uploaded.</strong> Pktivo processes files and results in this tab’s memory, without sending them to a server or saving capture history. Closing or reloading clears this view—not your original file or exports. Browser extensions and device access are outside Pktivo’s control.</p><GitHubLink label="View code" className="-mt-1 -mr-2 shrink-0" iconSize={14} /></div>;
}
