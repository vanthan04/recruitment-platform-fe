export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type WorkMode = "ONSITE" | "HYBRID" | "REMOTE";
export type JobLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR" | "MANAGER";
export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";
export type JobSortOption = "newest" | "salary_desc" | "views_desc";

// Well-known extraInfo keys the UI reads/writes explicitly. Anything else in
// extraInfo is opaque to the current UI but persists fine.
export const JOB_EXTRA_INFO_KEY = {
  WORKING_HOURS: "workingHours",
  APPLICATION_METHOD: "applicationMethod",
} as const;

export interface JobCompanySummary {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface JobCategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface JobSkillSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  level: JobLevel | null;
  status: JobStatus;
  viewCount: number;
  companyId: string;
  company: JobCompanySummary | null;
  categoryId: string | null;
  category: JobCategorySummary | null;
  skills: JobSkillSummary[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  requirements: string | null;
  benefits: string | null;
  // Free-form extra fields (working hours, application method, and whatever
  // else gets added later) — new keys need no migration.
  extraInfo: Record<string, string> | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  location?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  level?: JobLevel;
  categoryId?: string;
  companyId?: string;
  salaryMin?: number;
  salaryMax?: number;
  sort?: JobSortOption;
}

export interface JobMineListParams {
  page?: number;
  limit?: number;
  status?: JobStatus;
}

export interface CreateJobInput {
  title: string;
  description: string;
  location: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  level?: JobLevel;
  categoryId?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  extraInfo?: Record<string, string>;
  expiresAt?: string;
}

export type UpdateJobInput = Partial<CreateJobInput>;

export type JobOperation = {
  list: (params?: JobListParams) => Promise<{ items: Job[]; total: number; page: number; limit: number }>;
  detail: (id: string) => Promise<Job>;
};
