import type { EmploymentType, WorkMode } from "@/lib/types/job";

export interface SavedSearch {
  id: string;
  keyword: string | null;
  location: string | null;
  categoryId: string | null;
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  createdAt: string;
}

export interface CreateSavedSearchInput {
  keyword?: string;
  location?: string;
  categoryId?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
}
