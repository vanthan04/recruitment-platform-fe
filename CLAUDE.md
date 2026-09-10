# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Next.js (App Router) frontend for a job portal — the UI for `recruitment-platform-be` (separate repo, NestJS API). Part of a three-repo platform: this FE, `recruitment-platform-be` (backend), and `recruitment-platform-edge` (Cloudflare Worker that proxies realtime chat traffic in production — see Architecture below).

## Commands

```bash
npm run dev              # http://localhost:3000
npm run build
npm run start             # serve a production build

npm run lint
npm run typecheck          # tsc --noEmit
npm run format             # prettier --write .

npm test                  # jest
npm run test:watch
npx jest path/to/file.test.tsx     # single test
```

Husky + lint-staged run `eslint --fix` and `prettier --write` on staged files at commit time — no separate manual step needed before committing.

## Architecture

### Server-side API client, not a browser-facing SDK

`src/lib/api/index.ts` (`import "server-only"`) is the only thing that talks to the backend. It runs in Server Components / Server Actions / Route Handlers, never in the browser:

- Reads the access token from cookies and attaches `Authorization: Bearer`; on a `401` it transparently refreshes via the refresh-token cookie and retries once.
- `ApiError` is split into its own file (`src/lib/api/error.ts`) specifically so client components can `import { ApiError } from "@/lib/api/error"` without pulling in the `server-only` module graph — Next's bundler blocks a client bundle from including _any_ export of a module that imports `server-only`, even unused ones.
- `lib/services/*.service.ts` are the per-resource wrappers around this client (`job.service.ts`, `auth.service.ts`, etc.) — add new backend calls there, not ad-hoc `fetch`.

### Two env vars for the backend origin — don't confuse them

- `BACKEND_URL` — server-side only, used by `lib/api`. Required everywhere (local and prod).
- `NEXT_PUBLIC_BACKEND_URL` — **dev-only escape hatch** for the realtime chat socket (`src/lib/realtime/socket.ts`). Must stay **unset in production**: prod connects the socket via a relative path (`io("/ws")`) which Cloudflare (the `recruitment-platform-edge` Worker) routes to the real backend, so the browser bundle never contains the backend's real origin. Setting this in Vercel defeats that.

### Routing

`src/app` uses route groups: `(auth)/` (login, register, verify-email, OAuth callback, password reset) and `(main)/` (the authenticated app — jobs, applications, companies, messages, admin, recruiter dashboard, etc.). `middleware.ts` chains `withSession` (session cookie handling) then `withAuth` (route protection) on every request except static assets.

### UI

`src/components/ui` is shadcn/radix-based primitives; feature components are grouped by domain under `src/components/{jobs,companies,chat,home,layout,shared}`. Design references (tone, page-level specs) live in `design-system/recruitment-platform/`.

### Testing

Jest runs on Babel (`babel.jest.config.js`), **not** `next/jest`/SWC — the native SWC binary is blocked by a Windows Application Control policy on the dev machine, and its WASM fallback mangles `@/...` path aliases during transform. If tests start failing on path aliases, check this didn't regress before debugging further. `jest/` holds manual mocks for CSS, static files, `server-only`, and `next/cache`.

## Deploy

Deploys to Vercel (Node runtime — most routes are server-rendered, not static). Required Vercel env var: `BACKEND_URL` pointing at the backend's origin (EC2 Elastic IP or domain). Do **not** set `NEXT_PUBLIC_BACKEND_URL` on Vercel (see above). See [README.md](README.md) for the full deploy write-up.
