export type CompanySize = "SIZE_1_10" | "SIZE_11_50" | "SIZE_51_200" | "SIZE_201_500" | "SIZE_500_PLUS";
export type CompanyType = "PRODUCT" | "OUTSOURCING" | "STARTUP" | "CONSULTING";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  size: CompanySize | null;
  companyType: CompanyType | null;
  address: string | null;
  province: string | null;
  ward: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListParams {
  page?: number;
  limit?: number;
  keyword?: string;
}

export interface CreateCompanyInput {
  name: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  size?: CompanySize;
  companyType?: CompanyType;
  address?: string;
  province?: string;
  ward?: string;
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;
