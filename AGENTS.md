# SpiritScroll — Manhua & Donghua Progress Tracker

Personal media progress tracker with auto-scan for new chapter releases. React frontend deployed to Vercel, Hono backend deployed to Cloudflare Workers, Turso/libSQL database.

## Project

- **Stack**: TypeScript, Bun runtime, Hono, React 19 + Vite, Drizzle ORM, Tailwind CSS v4, TanStack Query
- **Entry points**:
  - Backend: `server/src/index.ts` (Hono app, routes, cron handler)
  - Frontend: `client/src/main.tsx` → `App.tsx`
  - Extension: `extension/` (Chrome Manifest V3, vanilla JS)
- **Database**: Turso/libSQL in production; local `file:spirit_scroll.sqlite` fallback for dev
- **Auth**: Single-user JWT (HS256, 24h expiry) + password hash via SHA-256

## Commands

```bash
# Server (from server/)
bun run dev          # Start with hot reload on :3000
bun run db:push      # Push Drizzle schema to database
bun run db:studio    # Open Drizzle Studio
bunx wrangler deploy # Deploy to Cloudflare Workers

# Client (from client/)
bun run dev          # Vite dev server on :5173
bun run build        # TypeScript check + Vite production build
bun run lint         # ESLint

# Smoke tests (from repo root)
bun server/src/test-api.ts                             # Local API test via hc custom fetch
SPIRIT_SCROLL_API_URL=https://your-api.example.com bun scripts/check-prod.js
bun test-cors.js
bun test-create-entry.js
```

## Architecture

```
server/src/
  index.ts          — Hono app: all CRUD routes, /api/check-all, rate limiter, cron handler
  auth.ts           — JWT create/verify, password hash/verify
  db/
    index.ts        — createDb(url?, authToken?) → Drizzle instance
    schema.ts       — `media` table (sqliteTable)
    zod.ts          — insert/patch/select Zod schemas via drizzle-zod
  utils/
    scraper.ts      — fetchCoverImage (scrapes og:image from sourceUrl)
    update-checker.ts — checkLatestChapter (site-specific cheerio scraping)

client/src/
  components/       — Dashboard, MediaCard, EditMediaDialog, Settings, Login, Layout, etc.
  hooks/            — useMediaList, useUpdateProgress, etc. (TanStack Query)
  lib/api.ts        — Hono RPC client (hc) with auth header injection
  context/          — AuthContext, ToastContext, SearchContext
  types/index.ts    — Media and PaginatedResponse interfaces

extension/          — Chrome extension: auto-tracks episodes from supported sites
  background.js     — Service worker: intercepts requests, syncs to API
  content.js        — Page scraping for Asura Scans, Animexin
  popup.js/html     — Extension popup UI
```

## Conventions

- **Indent**: 4 spaces in TypeScript (`client/src/`, `server/src/`); 2 spaces in vanilla JS (`extension/`)
- **Imports**: `verbatimModuleSyntax` enabled — use `import type` for type-only imports
- **Validation**: Zod schemas derived from Drizzle via `drizzle-zod` (`createInsertSchema`, `createSelectSchema`)
- **API client**: Uses Hono RPC client (`hc<AppType>`) in client code — not raw fetch
- **State**: TanStack Query with optimistic updates and `keepPreviousData` for pagination
- **Styling**: Tailwind CSS v4 utility classes; no CSS modules or styled-components
- **Error handling**: Backend returns proper HTTP status codes; client checks `res.ok` and throws
- **No test framework**: Manual smoke-test scripts only (`test-api.ts`, `check-prod.js`, test scripts at root); no Jest/Vitest
- **Database access**: Always through `createDb(url, authToken)` — never import a singleton db instance
- **Environment**: Server reads from Cloudflare Worker bindings (`c.env`) with `process.env` fallback for local dev (loaded from `.dev.vars` via `dotenv`)

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `rivaipurba/SpiritScroll`. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default mattpocock/skills triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain documentation layout. See `docs/agents/domain.md`.

## Notes
