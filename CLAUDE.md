# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on http://localhost:4321
npm run build        # Production build
npm run preview      # Preview production build locally
npm test             # Run Playwright E2E tests (npx playwright install first)
node scripts/load-test.mjs  # Load test against the running server
```

## Architecture

This is an **Astro 5.5 SSR blog** deployed on Vercel (`output: 'server'` with `@astrojs/vercel` adapter). It uses Tailwind CSS, MDX content collections, and Upstash Redis for dynamic data persistence.

### Dual content system

There are **two separate content sources** that get merged at read time:

1. **Astro Content Collections** (`src/content/blog/`) — markdown files with frontmatter schema defined in `src/content/config.ts`. These are the static blog posts committed to git. Used primarily for seeding and as a fallback data source.

2. **Dynamic posts in Redis/file storage** (`src/lib/db/posts.ts`) — posts created via the admin panel. Stored in Upstash Redis under key `boke:posts`, with a three-tier storage fallback: **Redis → `/tmp` files → `.data/` seed files**.

The `/api/posts` GET handler merges both sources, deduplicating by slug (content collection posts win), and seeds Redis on first request via `ensureSeeded()`.

### Data layer (`src/lib/db/`)

- **`storage.ts`** — low-level JSON file read/write to `/tmp/boke-data/` and `.data/`. Read order: try `/tmp` first (runtime writes), then `.data/` (seed data). Copy seed data to `/tmp` on first read.
- **`posts.ts`** — post CRUD with Redis + file dual-write. Each function has two variants: `Async` (tries Redis, falls back to file) and sync (file-only, for SSR pages that can't use top-level await). In-memory cache per request.
- **`comments.ts`** — same pattern as posts, stored under key `boke:comments`.
- **`types.ts`** — `PostData`, `CommentData`, `AdminSession`, `ApiResponse<T>`, and input types.

### PostBuilder pattern (`src/lib/builders/PostBuilder.ts`)

Posts should be created via the `PostBuilder` fluent API, not by constructing `PostData` objects directly. It auto-generates slug, SEO fields, reading time, and sanitizes HTML content.

```ts
const post = new PostBuilder()
  .setTitle('Hello')
  .setContent('...')
  .publishNow()
  .build()
```

### API routes (`src/pages/api/`)

All API routes are Astro SSR endpoints (`.ts` files with `export const GET/POST/PUT/DELETE`). Key routes:

| Endpoint | Purpose |
|---|---|
| `/api/posts` | Full CRUD; GET merges content collections + Redis posts |
| `/api/comments` | CRUD + approve/reject/pin/reply actions |
| `/api/auth` | Cookie-based admin login/logout (creds: admin/admin123) |
| `/api/db-status` | Redis connectivity check |
| `/api/posts/debug` | Redis read/write diagnostic |
| `/api/posts/fix-slugs` | One-off slug repair for Chinese characters |

All responses follow `{ success: boolean, data?: T, error?: string, message?: string }`.

### Validation layer (`src/lib/validation.ts`)

Content validation (sensitive word filtering, length checks, XSS sanitization, spam detection, rate limiting) is centralized here. The rate limiter uses an in-memory `globalThis.__rateLimitStore` (resets on cold start). Comments default to `pending` status and require admin approval.

### Page routing pattern

- Public pages: SSR rendered (top-level `export const prerender = false`), merge content collections + Redis data
- Blog post detail at `/blog/[...slug].astro` — tries content collection first, then falls back to Redis posts with a hand-rolled markdown-to-HTML converter
- Admin pages under `/admin/` — cookie-auth gated
- BaseLayout provides SEO meta tags, Open Graph, Twitter cards, JSON-LD structured data, and a header/footer slot system

### Path aliases (tsconfig.json)

```
@/*          → src/*
@components/* → src/components/*
@layouts/*   → src/layouts/*
@pages/*     → src/pages/*
@content/*   → src/content/*
```

### E2E tests

Playwright tests in `e2e/` run against the preview server (`npm run preview`) on port 4321. Two browser projects: desktop Chrome and Pixel 5 mobile Chrome.
