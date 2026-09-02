export const PATH = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  JOBS: "/jobs",
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  COMPANIES: "/companies",
  COMPANY_DETAIL: (id: string) => `/companies/${id}`,
  PROFILE: "/profile",
} as const;
