import type { JobType } from "@/lib/types/job";

export interface SavedSearch {
  id: string;
  keyword: string | null;
  location: string | null;
  categoryId: string | null;
  jobType: JobType | null;
  createdAt: string;
}

export interface CreateSavedSearchInput {
  keyword?: string;
  location?: string;
  categoryId?: string;
  jobType?: JobType;
}
