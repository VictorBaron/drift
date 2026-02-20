# Claude.md — ShoulderTap Electron App

## Purpose

This Electron app is the desktop client for ShoulderTap. It connects to the NestJS API (`apps/api/`) via SSE to receive real-time urgent notifications and displays them as native OS notifications.

## Structure

```
apps/electron/
  src/
    main.ts       # Main process — app lifecycle, BrowserWindow, SSE connection
  index.html      # Renderer entry point (loaded into BrowserWindow)
  tsconfig.json   # TypeScript configuration
  dist/           # Compiled output (git-ignored)
```

## Architecture Rules

### Process Model

Electron has two processes — follow their boundaries strictly:

- **Main process** (`src/main.ts`): Node.js environment. Handles app lifecycle, native APIs (Notifications, Tray, Menu), IPC, and all communication with the API. Never put business logic in the renderer.
- **Renderer process** (`index.html` + any JS loaded from it): Browser environment. UI only. No direct Node.js or Electron API access — communicate with the main process via `ipcRenderer`/`ipcMain`.

### Security Rules (mandatory)

- **Never disable `contextIsolation`** — it must remain `true`
- **Never set `nodeIntegration: true`** in the renderer — use a preload script with `contextBridge` to expose specific APIs
- **Never use `shell.openExternal`** on untrusted URLs
- **Content Security Policy** must be set on every HTML page (already in `index.html`)
- Keep `webSecurity: true` (default) — never disable it

### Communication with the API

- API base URL is `http://localhost:3000` (dev). Use an environment-aware config, not hardcoded strings.
- SSE connection for real-time notifications lives in the main process (`connectToNotificationStream`)
- Reconnect with a delay on connection drop or error (currently 5 s) — do not retry in a tight loop

### Native Notifications

- Use Electron's `Notification` API from the main process only
- Always provide a `title` and `body` — never show an empty notification
- Do not show notifications when the app is in focus unless the urgency warrants it

## Commands

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Launch the app
pnpm start

# Build and launch (dev)
pnpm dev
```

## Code Style

- TypeScript with strict mode enabled
- ES module imports (`import`/`export`), compiled to CommonJS for Electron main process
- Keep `src/main.ts` focused on wiring; extract helpers into separate files as complexity grows
- Prefer named constants over magic strings/numbers (e.g., `RECONNECT_DELAY_MS = 5000`)
