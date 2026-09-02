export type CompanySize = "SIZE_1_10" | "SIZE_11_50" | "SIZE_51_200" | "SIZE_201_500" | "SIZE_500_PLUS";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  industry: string | null;
  size: CompanySize | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  industry?: string;
}
