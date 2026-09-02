export const CACHE_TAG = {
  JOBS_LIST: "jobs-list",
  JOB_DETAIL: (id: string) => `job-${id}`,
  COMPANIES_LIST: "companies-list",
  COMPANY_DETAIL: (id: string) => `company-${id}`,
  CATEGORIES_LIST: "categories-list",
} as const;
