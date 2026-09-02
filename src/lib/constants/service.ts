// Single backend origin. If this ever becomes real microservices, the plan
// is a gateway (e.g. nginx) unifying them back into one origin for the
// frontend to call — so there's no per-resource origin to configure here.
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Every route is versioned under this prefix on the backend.
export const API_PREFIX = "/api/v1";
