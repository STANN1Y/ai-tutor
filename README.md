# Margin

A course-agnostic tutor front end for a RAG backend. The UI is a shelf of binders: a course opens
to its table of contents, and a section opens to a worksheet where the tutor writes in the margin
and cites the reading.

> **Note:** the Python/LangGraph backend is not part of this repo. The app runs against
> [MSW](https://mswjs.io/) fixtures in development and in the demo build, so no server is needed.

## Quick start

Requires Node 22.12+.

```bash
cd frontend
npm install
npm run dev        # http://localhost:4300
```

## Layout

- `frontend/` - the React + Vite app, tests, and the API contract (see `frontend/README.md`).
- `deploy/` - a small nginx compose file for serving the static demo build.
- `AGENTS.md` - notes for AI coding agents and contributors.

## License

MIT, see `LICENSE`.
