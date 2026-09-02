export const PATH = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  JOBS: "/jobs",
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  COMPANIES: "/companies",
  COMPANY_DETAIL: (id: string) => `/companies/${id}`,
  PROFILE: "/profile",
} as const;
