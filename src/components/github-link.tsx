import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Public source repository for Pktivo. */
export const PKTIVO_REPO_URL = 'https://github.com/Pktivo-tools/pktivo-network-analyzer';

type GitHubLinkProps = {
  /** Show the words next to the mark, or just the mark itself. */
  showLabel?: boolean;
  /** Words used when the label is shown. */
  label?: string;
  /** Extra classes for the whole control. */
  className?: string;
  /** Icon size in pixels. */
  iconSize?: number;
};

/** Clickable GitHub mark that opens the Pktivo repository in a new tab. */
export function GitHubLink({
  showLabel = true,
  label = 'Pktivo on GitHub',
  className = '',
  iconSize = 16,
}: GitHubLinkProps) {
  return (
    <Button asChild variant="ghost" size="sm" className={`text-xs text-muted-foreground ${className}`}>
      <a
        href={PKTIVO_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={showLabel ? undefined : 'Pktivo source code on GitHub'}
        title="Open the Pktivo repository on GitHub"
      >
        <Github aria-hidden="true" style={{ width: iconSize, height: iconSize }} className="shrink-0" />
        {showLabel && <span>{label}</span>}
      </a>
    </Button>
  );
}
