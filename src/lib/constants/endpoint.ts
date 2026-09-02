export const AUTH_ENDPOINT = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY: "/auth/verify",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
} as const;

export const USER_ENDPOINT = {
  ME: "/users/me",
} as const;

export const JOB_ENDPOINT = {
  LIST: "/jobs",
  DETAIL: (id: string) => `/jobs/${id}`,
} as const;

export const COMPANY_ENDPOINT = {
  LIST: "/companies",
  DETAIL: (id: string) => `/companies/${id}`,
} as const;

export const CATEGORY_ENDPOINT = {
  LIST: "/categories",
} as const;
