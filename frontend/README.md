# Margin

A course-agnostic tutor front end for a Python RAG backend. The UI is a shelf of binders; a
course opens to its table of contents, and a section opens to a worksheet where the tutor writes
in the margin and cites the reading. The front end currently runs against MSW fixtures, not a
live LangGraph service.

## Run

```bash
npm install
npm run dev        # http://localhost:4300
```

Port 4300 is deliberate: it avoids common dev ports such as 3000. The Vite config uses
`strictPort`, so a busy port fails instead of drifting.

## Hosted demo

The hosted demo uses the same fixtures in a production build:

```bash
npm run build:demo
cd .. && docker compose -f deploy/compose.yaml up -d
```

Static nginx serves `dist/` on port 4301 (published on all interfaces, so restrict it with a
firewall or bind address if needed). Put any HTTPS reverse proxy in front of it, for example
`https://tutor.example.com` proxying to `http://<host-ip>:4301` with Force SSL and HTTP/2. Because
MSW uses a service worker, use the HTTPS hostname (or `http://localhost:4301` for local checks),
not plain LAN HTTP. Rebuilding `dist/` updates the bind-mounted site without restarting the
container.

## Verify

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:demo
npx playwright install chromium   # once
npm run test:e2e
```

Tests use mocked SSE. Playwright projects cover desktop, mobile, and reduced motion. Scoped
selectors are required for section names because the TOC rows and the tab strip share labels.

## Structure

- `src/lib/api.ts`, `src/lib/types.ts` - the contract with the Python backend.
- `src/mocks/` - MSW handlers and the PSY 101 / HIST 110 fixtures.
- `src/styles/tokens.css` - the design tokens (paper, ink, cobalt, red pencil, highlighter).
- `src/features/` - shelf, contents, worksheet, sources.
- `src/features/*/*.module.css` - bespoke CSS modules. No Tailwind, no component library.

The mock completes a section after three attempts (one fixture turn plus two new turns). That is
intentional so the worked-answer flow can be exercised.

## Backend contract

Turns are created with `POST /api/sections/:sectionId/turns`, then streamed from
`GET /api/sections/:sectionId/turns/:turnId/stream` as SSE frames:

```ts
type StreamEvent =
  | { type: 'status'; phase: 'reading' | 'marking' }
  | { type: 'note'; text: string }
  | { type: 'explanation'; text: string }
  | { type: 'citations'; items: Citation[] }
  | { type: 'section'; sectionId: string; state: 'not-started' | 'in-progress' | 'complete' }
  | { type: 'error'; code: string; message: string; retryable: boolean }
  | { type: 'done'; turnId: string };
```

`note` is margin-sized; `explanation` is the longer worked answer and should only be requested
(or wrong answers will spoil the Socratic loop). Do not expose LangGraph node names to the UI;
map phases to the copy in `src/ui/Status.tsx`.
