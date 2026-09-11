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
if (process.env.NODE_ENV === "production" && !process.env.BACKEND_URL) {
  throw new Error(
    "BACKEND_URL is required in production — set it in the deploy environment (see CLAUDE.md).",
  );
}

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Every route is versioned under this prefix on the backend.
export const API_PREFIX = "/api/v1";

// Local-dev-only escape hatch for the realtime chat socket (see
// lib/realtime/socket.ts). In production this must stay unset: the edge
// proxy in front of the public domain routes /socket.io to the backend, so
// the socket connects with a relative path and never needs a backend origin
// exposed to client code. Locally there's no such proxy in front of `next
// dev`, so .env sets this to the backend's dev origin instead.
export const PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
