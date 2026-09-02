// Single backend origin. If this ever becomes real microservices, the plan
// is a gateway (e.g. nginx) unifying them back into one origin for the
// frontend to call — so there's no per-resource origin to configure here.
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Every route is versioned under this prefix on the backend.
export const API_PREFIX = "/api/v1";

// Public counterpart of BACKEND_URL — every other backend call happens
// server-side (see lib/api/index.ts), but the realtime chat socket must be
// opened directly from the browser (httpOnly cookies can't be attached to a
// client fetch, so there's no server-proxy path for it), which means this
// one origin has to be exposed to client code.
export const PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
