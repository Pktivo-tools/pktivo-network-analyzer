<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Pktivo architecture
- Persist only validated Learn completion IDs in device-local storage after hydration, independently of capture state, so learning works offline without storing packet data.
- Keep capture analysis in browser-safe `src/lib/netlens` modules so saved captures remain local and work offline.
- Keep appearance presets in global semantic CSS tokens and apply the validated saved theme after hydration; store only the appearance preference locally so themes survive reopening without storing capture data.
- Keep warning detection as pure full-capture heuristics separate from display filters so beginner explanations remain consistent.
- Capture files/results must stay in tab memory with no persistence or outbound reporting; clear on pagehide to prevent back/forward cache restoration and mark capture views/portals private for recorder defense in depth.
- Keep Pktivo browser-only: Wireshark records traffic externally and the web workspace inspects saved files; no native capture bridge or desktop packaging is needed.
