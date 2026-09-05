export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
export type WorkMode = "ONSITE" | "HYBRID" | "REMOTE";
export type JobLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR" | "MANAGER";
export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";
export type JobSortOption = "newest" | "salary_desc" | "views_desc";

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
  workingHours: string | null;
  applicationMethod: string | null;
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
  workingHours?: string;
  applicationMethod?: string;
  expiresAt?: string;
}

export type UpdateJobInput = Partial<CreateJobInput>;

export type JobOperation = {
  list: (params?: JobListParams) => Promise<{ items: Job[]; total: number; page: number; limit: number }>;
  detail: (id: string) => Promise<Job>;
};
