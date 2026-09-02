export type ServiceName = "auth" | "users" | "companies" | "categories" | "jobs";

const DEFAULT_ORIGIN = process.env.BACKEND_URL ?? "http://localhost:8080";

// Every route is versioned under this prefix on the real backend.
export const API_PREFIX = "/api/v1";

// Each backend domain can live on its own origin (microservices). Falls back
// to BACKEND_URL, then to a local-dev default, so a single monolith backend
// (the current case) works with zero extra env vars.
export const SERVICE_BASE_URL: Record<ServiceName, string> = {
  auth: process.env.AUTH_SERVICE_URL ?? DEFAULT_ORIGIN,
  users: process.env.USERS_SERVICE_URL ?? DEFAULT_ORIGIN,
  companies: process.env.COMPANIES_SERVICE_URL ?? DEFAULT_ORIGIN,
  categories: process.env.CATEGORIES_SERVICE_URL ?? DEFAULT_ORIGIN,
  jobs: process.env.JOBS_SERVICE_URL ?? DEFAULT_ORIGIN,
};
