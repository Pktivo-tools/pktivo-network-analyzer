import { Bug } from 'lucide-react';

export const FEEDBACK_URL = 'https://github.com/Pktivo-tools/pktivo-network-analyzer/issues';

/** Small, always-visible link to the public GitHub Issues page. */
export function FeedbackLink() {
  return (
    <a
      href={FEEDBACK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-3 right-3 z-40 inline-flex items-center gap-1.5 rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary print:hidden"
    >
      <Bug className="size-3.5" aria-hidden="true" />
      Report bug/Give feedback
    </a>
  );
}
