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

## Netlens architecture
- Keep capture analysis in browser-safe `src/lib/netlens` modules so saved captures remain local and work offline.
- Keep native capture and process access exclusively in Electron main behind a validated preload bridge; the hosted app only inspects files.
- Package Electron with a separate client-only Vite entry and relative asset paths, preserving the hosted TanStack bootstrap.
- Keep appearance presets in global semantic CSS tokens and apply the validated saved theme after hydration; store this device-only preference locally to preserve offline desktop support.
- Keep warning detection as pure full-capture heuristics separate from display filters so beginner explanations remain consistent.
- Optional on-device tutoring is an exception to hosted AI routing: Electron main uses a fixed loopback-only Ollama connection with opt-in and local-model validation; no capture context or cloud fallback is permitted.
- Serve versioned desktop downloads through immutable asset pointers; keep installer update feeds separately configured at build time so preview downloads never imply working automatic updates.
- Keep electron-updater in Electron main only and enabled only for configured installer releases; pause during recording and require explicit restart to protect unsaved captures.
- Capture files/results must stay in tab memory with no persistence or outbound reporting; clear on pagehide to prevent back/forward cache restoration and mark capture views/portals private for recorder defense in depth.
