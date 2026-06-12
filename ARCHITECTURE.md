# Microfrontend System — Technical Overview

Two projects work together:
- **`mf-angular-app`** — Angular 16 shell/host. Renders topic cards, event log sidebar, filter form. Loads React MFE on demand.
- **`mf-react-app`** — React 18 + Vite remote. Renders a ContactSupport chat overlay inside the Angular shell.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Local setup (both apps)

**Terminal 1 — React MFE (must start first, Angular expects it at `:8080`)**

```bash
cd projects/mf-react-app
npm install
npm run preview        # builds dev env + serves on http://127.0.0.1:8080
```

**Terminal 2 — Angular shell**

```bash
cd projects/mf-angular-app
npm install
npm start              # dev server on http://localhost:4200 (uses local env by default)
```

Open `http://localhost:4200`, click the **💬 Support** button. React MFE loads and mounts as overlay. Then click any topic card to send it to the React chat, or type in the chat to see messages appear in the event log.

> **Why `preview` for React?** The Angular shell loads the React MFE via its built Vite manifest (`/.vite/manifest.json`). Vite's `dev` server does NOT generate a manifest — only a production/preview build does. `npm run preview` builds with `ENV=dev` then serves the `dist/` folder via `http-server` on port 8080.

---

## Environment Matrix

| Angular config | React MFE origin | When to use |
|---|---|---|
| `local` (default) | `http://127.0.0.1:8080` | Full local dev |
| `development` | `https://nicolasticona.github.io/mf-react-app` | Angular local + React on GitHub Pages |
| `production` | `https://nicolasticona.github.io/mf-react-app` | Production (GitHub Pages) |

Angular's `defaultConfiguration` in `angular.json` is `local`.

Each environment also sets `cacheStrategy`:
- `local` — no `cacheStrategy` (defaults to `no-store` in `microfrontend.util.ts`) — always fetches fresh manifest
- `development` / `production` — `cacheStrategy: 'no-cache'` — revalidates via ETag (fast `304 Not Modified` when manifest unchanged)

---

## All Build Commands

### mf-react-app

```bash
npm run dev            # standalone Vite dev server on :3000 (no manifest, not loadable by Angular)
npm run preview        # build:dev + http-server ./dist on :8080  ← use for local integration
npm run build:dev      # build with ENV=dev  → dist/
npm run build:prod     # build with ENV=prod → dist/ (used by GitHub Actions)
```

### mf-angular-app

```bash
npm start              # ng serve with local config → :4200
npm run build:local    # build + generate-manifest.js → dist/
npm run build:dev      # build with dev env + generate manifest
npm run build:prod     # build with prod env + --base-href /mf-angular-app/ + generate manifest
npm run preview        # build:local + http-server ./dist on :4001
npm test               # Karma + Jasmine unit tests
```

---

## Architecture

### How MFE loading works

No Webpack Module Federation. Custom approach: **Vite manifest + dynamic DOM injection**.

```
User clicks 💬 Support button
    └─> DummySupportComponent.loadMicrofront()
            └─> fetch <origin>/.vite/manifest.json   (cache strategy per environment)
                    └─> extract entry JS + CSS filenames from manifest
                            └─> inject <script type="module"> + <link rel="stylesheet"> into <head>
                                    └─> React main.jsx executes
                                            └─> dispatches MICROFRONTEND_LOADED
                                                    └─> Angular listens, dispatches MICROFRONTEND_RENDER
                                                            └─> React mounts App into provided DOM node
                                                                    └─> Two-way event listeners active
```

---

## Event Protocol

All communication happens through native DOM `CustomEvent`s dispatched on `window`. No shared state, no framework bridge.

### Bootstrap events (MFE lifecycle)

| Event | Direction | Payload | Meaning |
|---|---|---|---|
| `MICROFRONTEND_LOADED` | React → Angular | `{ name: "react-app" }` | Scripts loaded, awaiting mount instruction |
| `MICROFRONTEND_RENDER` | Angular → React | `{ name: "react-app", nodeToLoadIn: HTMLElement }` | Mount into this DOM node |

### Application events (two-way communication)

| Event | Direction | Payload | When fired |
|---|---|---|---|
| `CARD_SELECTED` | Angular → React | `{ title: string, content: string }` | User clicks a topic card |
| `SUPPORT_MESSAGE_SENT` | React → Angular | `{ message: string }` | User sends a message in the chat |

### Full event flow

```
[Angular: card click]
    └─> window.dispatchEvent(CARD_SELECTED { title, content })
            ├─> React useEffect handler → push card message into chat UI
            └─> Angular CARD_SELECTED listener → eventLog.push("📌 Angular → React: …")

[React: Enter in chat input]
    └─> window.dispatchEvent(SUPPORT_MESSAGE_SENT { message })
            ├─> Angular SUPPORT_MESSAGE_SENT listener → eventLog.push("💬 User → Angular: …")
            └─> React setState → push user message into chat UI
```

### Where listeners are registered

**Angular** (`dummy-support.component.ts` → `loadMicrofront()`):
- `MICROFRONTEND_LOADED` — `{ once: true }` — logs manifest fetch confirmation, dispatches `MICROFRONTEND_RENDER`
- `MICROFRONTEND_RENDER` — `{ once: true }` — logs MFE mounted
- `SUPPORT_MESSAGE_SENT` — persistent — logs each user message as `💬 User → Angular: "…"`
- `CARD_SELECTED` — persistent — logs each card dispatch as `📌 Angular → React: "…"`

All listeners use `NgZone.run()` so Angular change detection fires correctly from native DOM events.

**React** (`ContactSupport.jsx` → `useEffect`):
- `CARD_SELECTED` — registered on mount, cleaned up on unmount — pushes `{ type: 'card', title, content }` into messages state

---

## Event Log Sidebar

`EventLogService` (`src/app/services/event-log.service.ts`) is a root-level singleton that acts as the shared log store:

```
DummySupportComponent  ──writes──►  EventLogService.events[]  ──reads──►  AppComponent sidebar
```

- `DummySupportComponent` calls `eventLog.push(msg)` for every protocol event and application event it observes
- `AppComponent` renders `eventLog.events` as a static left sidebar column (`<aside class="event-log-sidebar">`)
- Sidebar is always visible; shows "Click Support to start" placeholder when empty
- New entries animate in via `@keyframes slideIn`

---

## React Dual-Mode Detection

`src/constants/app.constants.js` determines whether React boots standalone or waits for Angular:

```js
const whiteListBootstrap = [
    'http://localhost:3000',
    'http://127.0.0.1:8080',
];
export const isBootstrap =
    whiteListBootstrap.includes(window.location.origin) ||
    window.location.pathname.startsWith('/mf-react-app');
```

- **Bootstrap mode** — mounts into `#react-root` immediately (standalone app)
- **Hosted mode** — emits `MICROFRONTEND_LOADED`, waits for `MICROFRONTEND_RENDER`

The pathname check (`/mf-react-app`) handles GitHub Pages, where both apps share the same origin (`https://nicolasticona.github.io`) so origin-only whitelisting would break hosted mode.

---

## GitHub Pages Deployment

Both apps deploy automatically on push to `master` via GitHub Actions (`.github/workflows/deploy.yml`).

| App | Live URL |
|---|---|
| Angular shell | `https://nicolasticona.github.io/mf-angular-app/` |
| React MFE | `https://nicolasticona.github.io/mf-react-app/` |

### Key deployment details

**React:**
- `VITE_BASE_PATH=/mf-react-app/` passed at build time so asset URLs include the subpath
- `public/.nojekyll` prevents Jekyll from dropping the `.vite/` directory (manifest would 404 otherwise)

**Angular:**
- `--base-href /mf-angular-app/` in `build:prod` so Angular's asset references include the subpath
- `dist/index.html` copied to `dist/404.html` so Angular router handles deep-link 404s client-side
- `touch dist/.nojekyll` prevents Jekyll processing

**One-time GitHub setup** (per repo): Settings → Pages → Source → **GitHub Actions**

---

## Project Structures

### mf-angular-app

```
src/
├── app/
│   ├── components/
│   │   ├── header/                 # Title bar + support button
│   │   ├── card/                   # Topic card — click dispatches CARD_SELECTED
│   │   ├── filter-form/            # Text input + Clear/Submit
│   │   └── dummy-support/          # Support button → triggers MFE load + registers event listeners
│   ├── services/
│   │   └── event-log.service.ts    # Root singleton — shared log state (push / clear)
│   ├── utils/
│   │   └── microfrontend.util.ts   # Fetch manifest (with cacheStrategy), inject scripts, dispatch MICROFRONTEND_RENDER
│   ├── interfaces/
│   │   └── topic.interface.ts      # { id, title, description }
│   ├── mocks/
│   │   └── topics.mock.ts          # 10 hardcoded topics
│   └── app.module.ts / app.component.*   # Root; renders event-log sidebar + card grid
├── environments/
│   ├── environment.type.ts         # Microfrontend type (includes cacheStrategy?: RequestCache)
│   ├── environment.ts              # Default (local) — React origin: http://127.0.0.1:8080
│   ├── environment.local.ts        # Same as default
│   ├── environment.development.ts  # React origin: nicolasticona.github.io/mf-react-app
│   └── environment.production.ts   # React origin: nicolasticona.github.io/mf-react-app
└── main.ts
.github/workflows/deploy.yml        # CI: build:prod → copy 404.html → .nojekyll → deploy to Pages
generate-manifest.js                # Post-build: scans dist/, writes dist/manifest.json
```

### mf-react-app

```
src/
├── main.jsx                        # Entry — dual-mode bootstrap logic
├── App.jsx                         # Renders <ContactSupport />
├── components/
│   └── ContactSupport/
│       ├── ContactSupport.jsx      # Chat UI — listens CARD_SELECTED, dispatches SUPPORT_MESSAGE_SENT
│       └── ContactSupport.css      # Dark theme; cs-bot-message / cs-user-message / cs-card-message
├── constants/
│   └── app.constants.js            # isBootstrap — origin whitelist + pathname check
├── environments/
│   ├── setup-environment.js        # Copies environment.<ENV>.js → environment.js at build time
│   ├── environment.local.js
│   ├── environment.dev.js
│   └── environment.prod.js
└── utils/
    └── microfrontend.util.ts       # (stub, unused)
public/
└── .nojekyll                       # Prevents Jekyll from dropping .vite/ on GitHub Pages
vite.config.js                      # build.manifest: true; base: VITE_BASE_PATH ?? '/'
.github/workflows/deploy.yml        # CI: build:prod (VITE_BASE_PATH=/mf-react-app/) → deploy to Pages
```

---

## Angular Components

| Component | Selector | Standalone | Role |
|---|---|---|---|
| `AppComponent` | `app-root` | No | Root; event-log sidebar + topic grid + filter |
| `HeaderComponent` | `app-header` | Yes | Title bar + support button |
| `CardComponent` | `app-card` | Yes | Topic card; click dispatches `CARD_SELECTED` |
| `FilterFormComponent` | `app-filter-form` | Yes | Text input + Clear/Submit |
| `DummySupportComponent` | `app-dummy-support` | Yes | Triggers MFE load; registers all event listeners |

---

## Manifest Generation

### React (Vite built-in)

`vite.config.js` sets `build.manifest: true`. After build, Vite writes `dist/.vite/manifest.json` mapping source entry to hashed output filenames. Angular reads this at runtime to know which JS/CSS to inject.

### Angular (custom)

`generate-manifest.js` runs post-build and writes `dist/manifest.json`:

```json
{
  "scripts": ["runtime.<hash>.js", "polyfills.<hash>.js", "main.<hash>.js"],
  "styles": ["styles.<hash>.css"]
}
```

Enables this Angular shell to itself be consumed as a remote MFE by a higher-level host.

---

## Key Design Decisions

- **No Webpack Module Federation** — Vite manifest + script injection is lighter, avoids shared module negotiation.
- **Event-based communication** — DOM `CustomEvent`s decouple Angular and React; no shared state, no framework bridge. Events are the only contract between the two apps.
- **`NgZone.run()` for DOM listeners** — native `window.addEventListener` callbacks run outside Angular's zone; `zone.run()` is required to trigger change detection.
- **`EventLogService` singleton** — `providedIn: 'root'` lets `DummySupportComponent` (writer) and `AppComponent` (reader) share state without prop drilling or module coupling.
- **`cacheStrategy` per environment** — local uses `no-store` (always fresh); deployed envs use `no-cache` (ETag revalidation — fast 304 when manifest unchanged).
- **CSS namespacing (`cs-` prefix)** — all React ContactSupport classes are prefixed to prevent bleed into Angular's global styles when the component mounts inside the shell.
- **File-copy env strategy (React)** — `setup-environment.js` copies the right env file at build time. No `.env` files, no Vite `define` injection.
- **Standalone Angular components** — modern Angular pattern; no feature NgModules.
- **No routing** — shell is a single page; MFE renders in a fixed bottom-right overlay, not a route.
- **Manifest symmetry** — Angular shell generates its own manifest so it can be loaded as a remote by a future higher-level host.
