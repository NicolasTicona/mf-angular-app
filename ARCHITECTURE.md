# Microfrontend System — Technical Overview

Two projects work together:
- **`mf-angular-app`** — Angular 16 shell/host. Renders topic cards, filter form. Loads React MFE on demand.
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

Open `http://localhost:4200`, click the support icon (top-right header). React MFE loads and mounts as overlay.

> **Why `preview` for React?** The Angular shell loads the React MFE via its built Vite manifest (`/.vite/manifest.json`). Vite's `dev` server does NOT generate a manifest — only a production/preview build does. `npm run preview` builds with `ENV=dev` then serves the `dist/` folder via `http-server` on port 8080.

---

## Environment Matrix

| Angular config | React MFE origin | When to use |
|---|---|---|
| `local` (default) | `http://127.0.0.1:8080` | Full local dev |
| `development` | `https://mf-react-app-dev.vercel.app` | Angular local + React deployed |
| `production` | `https://mf-react-app-prod.vercel.app` | Production |

Angular's `defaultConfiguration` in `angular.json` is `local`.

---

## All Build Commands

### mf-react-app

```bash
npm run dev            # standalone Vite dev server on :3000 (no manifest, not loadable by Angular)
npm run preview        # build:dev + http-server ./dist on :8080  ← use for local integration
npm run build:dev      # build with ENV=dev  → dist/ (deployable to dev Vercel)
npm run build:prod     # build with ENV=prod → dist/ (deployable to prod Vercel)
```

### mf-angular-app

```bash
npm start              # ng serve with local config → :4200
npm run build:local    # build + generate-manifest.js → dist/
npm run build:dev      # build with dev env + generate manifest
npm run build:prod     # build with prod env + generate manifest
npm run preview        # build:local + http-server ./dist on :4001
npm test               # Karma + Jasmine unit tests
```

---

## Architecture

### How MFE loading works

No Webpack Module Federation. Custom approach: **Vite manifest + dynamic DOM injection**.

```
User clicks support icon
    └─> DummySupportComponent → loadMicrofrontend('react-app')
            └─> fetch <origin>/.vite/manifest.json
                    └─> extract entry JS + CSS filenames
                            └─> inject <script> + <link> into DOM
                                    └─> React main.jsx executes
                                            └─> dispatches MICROFRONTEND_LOADED
                                                    └─> Angular listens, dispatches MICROFRONTEND_RENDER
                                                            └─> React mounts App into provided DOM node
```

### Event protocol

| Event | Direction | Payload | Meaning |
|---|---|---|---|
| `MICROFRONTEND_LOADED` | React → Angular | `{ name: "react-app" }` | Scripts ready, awaiting mount instruction |
| `MICROFRONTEND_RENDER` | Angular → React | `{ name: "react-app", nodeToLoadIn: HTMLElement }` | Mount here |

### React dual-mode detection

`src/constants/app.constants.js` whitelists origins where the React app boots standalone:

```js
const whiteListBootstrap = [
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'https://mf-react-app-dev.vercel.app',
  'https://mf-react-app-prod.vercel.app'
];
export const isBootstrap = whiteListBootstrap.includes(window.location.origin);
```

- **Bootstrap mode** (whitelisted origin): mounts into `#react-root` immediately
- **Hosted mode** (loaded by Angular shell): emits `MICROFRONTEND_LOADED`, waits for `MICROFRONTEND_RENDER`

---

## Project Structures

### mf-angular-app

```
src/
├── app/
│   ├── components/
│   │   ├── header/             # Title bar + support icon button
│   │   ├── card/               # Topic card (title + description)
│   │   ├── filter-form/        # Text input + Clear/Submit
│   │   └── dummy-support/      # Support button → triggers MFE load
│   ├── utils/
│   │   └── microfrontend.util.ts   # Fetch manifest, inject scripts, dispatch events
│   ├── interfaces/
│   │   └── topic.interface.ts      # { id, title, description }
│   ├── mocks/
│   │   └── topics.mock.ts          # 10 hardcoded topics
│   └── app.module.ts / app.component.*
├── environments/
│   ├── environment.type.ts
│   ├── environment.local.ts        # React origin: http://127.0.0.1:8080
│   ├── environment.development.ts  # React origin: mf-react-app-dev.vercel.app
│   └── environment.production.ts   # React origin: mf-react-app-prod.vercel.app
└── main.ts
generate-manifest.js   # Post-build: scans dist/, writes dist/manifest.json
```

### mf-react-app

```
src/
├── main.jsx                    # Entry — dual-mode bootstrap logic
├── App.jsx                     # Renders <ContactSupport />
├── components/
│   └── ContactSupport/
│       ├── ContactSupport.jsx  # Chat UI (Enter key adds message)
│       └── ContactSupport.css
├── constants/
│   └── app.constants.js        # isBootstrap whitelist check
├── environments/
│   ├── setup-environment.js    # Copies environment.<ENV>.js → environment.js at build time
│   ├── environment.local.js    # { isLocal: true, isProduction: false }
│   ├── environment.dev.js      # { isLocal: false, isProduction: false }
│   └── environment.prod.js     # { isLocal: false, isProduction: true }
└── utils/
    └── microfrontend.util.ts   # (stub, empty)
vite.config.js                  # build.manifest: true, server.port: 3000
```

---

## Manifest Generation

### React (Vite built-in)

`vite.config.js` sets `build.manifest: true`. After build, Vite writes `dist/.vite/manifest.json` mapping source files to hashed output filenames. Angular reads this to know which JS/CSS to inject.

### Angular (custom)

`generate-manifest.js` runs post-build and writes `dist/manifest.json`:

```json
{
  "scripts": ["runtime.<hash>.js", "polyfills.<hash>.js", "main.<hash>.js"],
  "styles": ["styles.<hash>.css"]
}
```

Enables this Angular app to itself be consumed as a remote MFE by another host.

---

## Angular Components

| Component | Selector | Standalone | Role |
|---|---|---|---|
| `AppComponent` | `app-root` | No | Root; topic grid + filter |
| `HeaderComponent` | `app-header` | Yes | Title bar + support icon |
| `CardComponent` | `app-card` | Yes | Single topic card |
| `FilterFormComponent` | `app-filter-form` | Yes | Text input + Clear/Submit |
| `DummySupportComponent` | `app-dummy-support` | Yes | Triggers MFE load on click |

---

## Key Design Decisions

- **No Webpack Module Federation** — Vite manifest + script injection is lighter, avoids shared module negotiation.
- **Event-based communication** — DOM custom events decouple Angular and React; no shared state or framework bridge.
- **File-copy env strategy (React)** — `setup-environment.js` copies the right env file at build time. No `.env` files, no Vite `define` injection.
- **Standalone Angular components** — modern Angular pattern; no feature NgModules.
- **No routing** — shell is a single page; MFEs render in fixed overlays, not routes.
- **Manifest symmetry** — Angular shell generates its own manifest so it can be loaded as a remote by a future higher-level host.
