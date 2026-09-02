"use server";

import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { COMPANY_ENDPOINT } from "@/lib/constants/endpoint";
import type { ListMeta } from "@/lib/types/common";
import type { Company, CompanyDetail, CompanyListParams } from "@/lib/types/company";

export async function getCompanies(
  params: CompanyListParams = {},
): Promise<{ items: Company[]; meta?: ListMeta }> {
  const { items, metadata } = await api.companies.getPaginated<Company[]>(COMPANY_ENDPOINT.LIST, {
    searchParams: params,
    skipAuth: true,
    next: { tags: [CACHE_TAG.COMPANIES_LIST] },
  });
  return { items, meta: metadata };
}

export async function getCompanyById(id: string): Promise<CompanyDetail> {
  return api.companies.get<CompanyDetail>(COMPANY_ENDPOINT.DETAIL(id), {
    skipAuth: true,
    next: { tags: [CACHE_TAG.COMPANY_DETAIL(id)] },
  });
}
