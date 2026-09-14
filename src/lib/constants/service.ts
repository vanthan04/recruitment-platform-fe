// Backend origin exposed to the browser, for the realtime chat socket (see
// lib/realtime/socket.ts) to connect directly to — there's no edge proxy in
// front of the public domain rewriting /socket.io to the backend, so the
// client needs the real origin. Required in both dev and production; the
// backend's CORS_ORIGIN must list this app's origin back (see
// recruitment-platform-be's cors.config.ts) since the two are cross-origin.
//
// Deliberately the only export left in this file (see backend-url.ts for
// BACKEND_URL/API_PREFIX) — this module has no "server-only" guard, so
// anything exported here is safe to end up in a client bundle.
export const PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
