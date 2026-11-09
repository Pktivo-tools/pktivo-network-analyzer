# Netlens desktop preview 0.1

Portable, unsigned preview packages. Extract the entire archive before launching.

- Windows x64: run Netlens.exe. Live capture requires Wireshark's dumpcap and Npcap.
- macOS Intel or Apple Silicon: open Netlens.app. Unsigned apps may require approval in System Settings → Privacy & Security after the first launch attempt. This preview is not notarized.
- Linux x64: run ./Netlens. Electron needs desktop system libraries. Do not run the app as root or disable its sandbox.

Saved PCAP/PCAPNG files and all analysis work offline. Fonts are bundled. Captures are never uploaded.

## Live capture permissions

Netlens does not ask for or store administrator passwords. It uses installed dumpcap (preferred) or tcpdump with your existing interface permissions. Configure capture permissions using your OS or capture tool's documented procedure. On Linux, the distribution's Wireshark package commonly offers a capture-permissions setup. On macOS, Wireshark's ChmodBPF package can grant capture access. On Windows, install Npcap and ensure capture access is allowed.

Windows pktmon fallback, automatic privileged setup, signed installers, decryption, and full TCP sequence reassembly are not included. Live capture requires verification on each target operating system. No production-ready or Wireshark feature-parity claim is made.

## Build

bun install
bun run desktop:build
bun run desktop:package

The desktop renderer is a separate static client build; the hosted TanStack app remains unchanged.

## Optional local tutor

Claude is hosted and cannot run locally. The Local help tab instead supports a separately installed Ollama with a downloaded local model (for example `ollama pull llama3.2:3b`). Downloading needs internet; inference works offline. Set `OLLAMA_NO_CLOUD=1` in your OS environment before starting Ollama and keep its default loopback-only binding. Restart Ollama after changing its environment.

Help is disabled by default and when leaving the tab. Netlens contacts only `127.0.0.1:11434`, refuses redirects and remote/cloud model metadata, and never attaches captures or history. The renderer retains `connect-src 'none'`. Netlens cannot control other software on your machine: use a trusted Ollama installation and local model. The browser version does not connect to local models. Previously downloaded preview archives do not include this update; a new desktop build is required.
