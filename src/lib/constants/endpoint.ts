export const AUTH_ENDPOINT = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY: "/auth/verify",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  CHANGE_PASSWORD: "/auth/change-password",
} as const;

export const USER_ENDPOINT = {
  ME: "/users/me",
  PROFILE: "/users/profile",
} as const;

export const FILE_ENDPOINT = {
  UPLOAD: "/files/upload",
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

export const CV_ENDPOINT = {
  LIST: "/cvs",
  DETAIL: (id: string) => `/cvs/${id}`,
  PUBLISH: (id: string) => `/cvs/${id}/publish`,
  UPLOAD: (id: string) => `/cvs/${id}/upload`,
  EXPORT: (id: string) => `/cvs/${id}/export`,
} as const;

export const JOB_APPLICATION_ENDPOINT = {
  LIST: "/job-applications",
  MY_APPLICATIONS: "/job-applications/my-applications",
  WITHDRAW: (id: string) => `/job-applications/${id}/withdraw`,
  FOR_JOB: (jobId: string) => `/job-applications/job/${jobId}`,
  STATS: (jobId: string) => `/job-applications/job/${jobId}/stats`,
  STATUS: (id: string) => `/job-applications/${id}/status`,
} as const;

export const BOOKMARK_ENDPOINT = {
  TOGGLE: (jobId: string) => `/bookmarks/toggle/${jobId}`,
  LIST: "/bookmarks",
} as const;
