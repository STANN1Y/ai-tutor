# AGENTS.md

This repo is the front end for **Margin**, a course-agnostic RAG tutor. The Python/LangGraph
backend is not in this repo: development and the hosted demo run against MSW fixtures. A small
static-hosting compose file lives in `deploy/`.

## Commands (run from `frontend/`)

```bash
npm install
npm run dev                  # http://localhost:4300, strictPort
npm run lint                 # oxlint
npm run typecheck            # tsc -b
npm test                     # Vitest + jsdom, unit/component tests
npm run test:e2e             # Playwright: desktop, mobile, reduced-motion
npm run build                # tsc -b && vite build (mocks off)
npm run build:demo           # production build with MSW demo fixtures
```

- Single unit test: `npx vitest run src/features/shelf/BinderCover.test.tsx -t "renders"`
- Single e2e test: `npx playwright test --project=chromium -g "streams a tutor note"`
- First e2e run needs `npx playwright install chromium`. The Playwright webServer reuses a
  running dev server when present.
- npm 9 / Node 22; pnpm is not installed. Vite 8 needs Node 22.12+.

## Hosting

From the repo root:

```bash
cd frontend && npm install && npm run build:demo
cd .. && docker compose -f deploy/compose.yaml up -d
```

The static nginx container serves `frontend/dist` on `<host-ip>:4301` (published on all
interfaces). Put an HTTPS reverse proxy in front of it, for example at
`https://tutor.example.com` (Force SSL, HTTP/2, caching off). Rebuilding `frontend/dist` updates
the bind-mounted site without restarting the container.

## Non-obvious facts

- **Port 4300 is deliberate.** It avoids common dev ports such as 3000; `strictPort` means a
  busy port fails instead of silently moving. Do not change it to 3000. The hosted static demo
  uses 4301 and is intended to sit behind an HTTPS reverse proxy.
- **No Tailwind and no UI kit.** Styling is bespoke CSS Modules plus tokens in
  `src/styles/tokens.css`. Fonts are self-hosted Fontsource (Spectral latin, Familjen Grotesk).
  The one bold device is the tabbed fore-edge + margin notes; avoid cards, chat bubbles, and
  gradient/rounded-SaaS chrome.
- **MSW runs in development and in the demo build** (`src/main.tsx`, `.env.demo`,
  `VITE_ENABLE_MOCKS`). The normal `npm run build` leaves mocks off for a real backend.
  `public/mockServiceWorker.js` is generated with `npx msw init public --save`; do not edit it by
  hand. MSW 3 uses `onUnhandledFrame`, not the older `onUnhandledRequest`.
- **The hosted demo requires HTTPS or localhost.** Service workers do not run on plain LAN HTTP,
  so use the HTTPS hostname (or `http://localhost:4301`), not `http://<host-ip>:4301`.
- **Course-agnostic rule:** no subject-specific UI or copy. PSY 101 and HIST 110 are fixtures;
  substitute content in `src/mocks/fixtures.ts`, not in components.
- **Mock completion is 3 attempts** (one seed turn + two new turns). That is intentional so the
  worked-answer unlock can be exercised; it is not an off-by-one bug.
- **SSE is read from `fetch`**, not `EventSource`: create a turn with `POST /sections/:id/turns`,
  then read `GET /sections/:id/turns/:turnId/stream`. Contract and event union are in
  `src/lib/types.ts`; parser is in `src/lib/api.ts`. `note` is margin-sized; `explanation` is the
  long worked answer and must stay hidden until "Show worked answer".
- **Native `<dialog>`** handles the add-course form and source drawer (Escape and backdrop close).
  Do not add a modal/card library for this.
- **E2E selectors:** TOC rows and the tab strip share section labels. Scope names:
  `getByRole('navigation', { name: 'Table of contents' })` vs `'Sections'`; otherwise strict-mode
  duplicate failures. Avoid CSS-module hashed classes.
- Routes: `/`, `/c/:id`, `/c/:id/s/:sectionId`, `/c/:id/sources`.
- No auth, no real PDF rendering/crops, and no backend in the repo yet; the hosted demo is
  fixtures only. `frontend/README.md` has the run/verify notes and the API contract.
- Commit only when the user explicitly asks.
