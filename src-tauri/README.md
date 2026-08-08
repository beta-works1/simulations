# GS8 Tauri wrapper (Tier 3 offline desktop)

This folder scaffolds a Tauri 2 shell around the Vite `dist/` output so classrooms can run the app with the network adapter disabled.

## Prerequisites
- Rust toolchain (`rustup`)
- Platform build tools (Xcode CLT on macOS, WebView2 on Windows)
- `@tauri-apps/cli` as a project (or global) dependency

## First-time setup
```bash
npm install -D @tauri-apps/cli
npm run build
npm run tauri:dev
```

`tauri.conf.json` points `frontendDist` at `../dist` and expects the web app to already be built.

## Status
Config-only scaffold until Rust is installed on the builder machine. No binary artifact is checked into git.
