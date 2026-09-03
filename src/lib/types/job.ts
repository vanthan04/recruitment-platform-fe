export type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "REMOTE";
export type JobLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE" | "SENIOR" | "MANAGER";
export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";

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

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  jobType: JobType;
  level: JobLevel | null;
  status: JobStatus;
  viewCount: number;
  companyId: string;
  company: JobCompanySummary | null;
  categoryId: string | null;
  category: JobCategorySummary | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  requirements: string | null;
  benefits: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  location?: string;
  jobType?: JobType;
  level?: JobLevel;
  categoryId?: string;
  companyId?: string;
  salaryMin?: number;
  salaryMax?: number;
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
  jobType?: JobType;
  level?: JobLevel;
  categoryId?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requirements?: string;
  benefits?: string;
  expiresAt?: string;
}

export type UpdateJobInput = Partial<CreateJobInput>;

export type JobOperation = {
  list: (params?: JobListParams) => Promise<{ items: Job[]; total: number; page: number; limit: number }>;
  detail: (id: string) => Promise<Job>;
};
