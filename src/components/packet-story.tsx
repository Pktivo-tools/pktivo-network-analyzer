import { ArrowDownLeft, ArrowUpRight, Globe, Home, Lock } from 'lucide-react';
import type { PacketStory } from '@/lib/netlens/packet-story';
export function PacketStoryCard({story}:{story:PacketStory}){
  const Icon=story.direction==='from-site'?ArrowDownLeft:story.direction==='local'?Home:ArrowUpRight;
  return <div className="mt-3 rounded-md border bg-muted/40 p-3 text-sm" data-private-capture>
    <p className="flex items-center gap-2 font-medium"><Icon className="size-4 shrink-0 text-primary"/>{story.summary}</p>
    <dl className="mt-3 grid gap-2 sm:grid-cols-3">
      <div><dt className="text-xs text-muted-foreground">From</dt><dd className="break-all font-mono text-xs">{story.srcIp}</dd><dd className="text-xs text-muted-foreground">{story.srcRole}</dd></div>
      <div><dt className="text-xs text-muted-foreground">To</dt><dd className="break-all font-mono text-xs">{story.dstIp}</dd><dd className="text-xs text-muted-foreground">{story.dstRole}</dd></div>
      <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><Globe className="size-3"/>Website</dt><dd className="break-all text-xs font-medium">{story.website??'Not visible in this capture'}</dd>{story.websiteSource&&<dd className="text-xs text-muted-foreground">{story.websiteSource}</dd>}</div>
    </dl>
    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3"/>Worked out on this device from the capture only — no lookups are sent anywhere.</p>
  </div>;
}
