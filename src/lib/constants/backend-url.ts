import "server-only";

// Single backend origin. If this ever becomes real microservices, the plan
// is a gateway (e.g. nginx) unifying them back into one origin for the
// frontend to call — so there's no per-resource origin to configure here.
//
// Required everywhere (see CLAUDE.md) — but the ?? fallback below meant a
// missing/mistyped Vercel env var in production degraded silently: every
// server-rendered page would quietly try (and fail) to reach
// http://localhost:8080, surfacing as a generic fetch error (or every user
// looking logged-out, via getCurrentUser()'s blanket catch) instead of a
// clear "BACKEND_URL is not configured" failure at boot.
//
// This lives in its own "server-only" module, separate from
// PUBLIC_BACKEND_URL (see service.ts) — this file used to hold both, and
// because service.ts had no "server-only" guard, a client component
// importing PUBLIC_BACKEND_URL (src/lib/realtime/socket.ts) pulled this
// entire module — throw included — into the browser bundle too. There,
// `process.env.BACKEND_URL` (not NEXT_PUBLIC_-prefixed) is statically
// replaced with `undefined` at build time regardless of what's actually
// configured on the server, so the guard always fired client-side,
// crashing every page that loads the chat socket no matter how correctly
// BACKEND_URL was set in the deploy environment.
if (process.env.NODE_ENV === "production" && !process.env.BACKEND_URL) {
  throw new Error(
    "BACKEND_URL is required in production — set it in the deploy environment (see CLAUDE.md).",
  );
}

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Every route is versioned under this prefix on the backend.
export const API_PREFIX = "/api/v1";
