export const AUTH_ENDPOINT = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY: "/auth/verify",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  LOGOUT_ALL: "/auth/logout-all",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  CHANGE_PASSWORD: "/auth/change-password",
} as const;

export const USER_ENDPOINT = {
  ME: "/users/me",
  PROFILE: "/users/profile",
} as const;

export const ADMIN_USER_ENDPOINT = {
  LIST: "/admin/users",
  DETAIL: (id: string) => `/admin/users/${id}`,
} as const;

export const ADMIN_RBAC_ENDPOINT = {
  ROLES: "/admin/roles",
  ROLE_DETAIL: (id: string) => `/admin/roles/${id}`,
  PERMISSIONS: "/admin/permissions",
  ROLE_PERMISSIONS: (id: string) => `/admin/roles/${id}/permissions`,
} as const;

export const FILE_ENDPOINT = {
  UPLOAD: "/files/upload",
} as const;

export const JOB_ENDPOINT = {
  LIST: "/jobs",
  MINE: "/jobs/mine",
  DETAIL: (id: string) => `/jobs/${id}`,
  CLOSE: (id: string) => `/jobs/${id}/close`,
  REOPEN: (id: string) => `/jobs/${id}/reopen`,
} as const;

export const COMPANY_ENDPOINT = {
  LIST: "/companies",
  DETAIL: (id: string) => `/companies/${id}`,
} as const;

export const CATEGORY_ENDPOINT = {
  LIST: "/categories",
  DETAIL: (id: string) => `/categories/${id}`,
} as const;

export const CV_ENDPOINT = {
  LIST: "/cvs",
  DETAIL: (id: string) => `/cvs/${id}`,
  PUBLISH: (id: string) => `/cvs/${id}/publish`,
  DOWNLOAD: (id: string) => `/cvs/${id}/download`,
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

export const NOTIFICATION_ENDPOINT = {
  LIST: "/notifications",
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: "/notifications/read-all",
} as const;

export const SAVED_SEARCH_ENDPOINT = {
  LIST: "/saved-searches",
  DETAIL: (id: string) => `/saved-searches/${id}`,
} as const;

export const INTERVIEW_ENDPOINT = {
  LIST: "/interviews",
  DETAIL: (id: string) => `/interviews/${id}`,
  CANCEL: (id: string) => `/interviews/${id}/cancel`,
  FOR_APPLICATION: (applicationId: string) => `/interviews/application/${applicationId}`,
} as const;

export const CHAT_ENDPOINT = {
  CONVERSATIONS: "/conversations",
  CONVERSATION_DETAIL: (id: string) => `/conversations/${id}`,
  MESSAGES: (conversationId: string) => `/conversations/${conversationId}/messages`,
  READ: (conversationId: string) => `/conversations/${conversationId}/read`,
  MESSAGE_DETAIL: (id: string) => `/messages/${id}`,
} as const;
