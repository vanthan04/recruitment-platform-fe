"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { COMPANY_ENDPOINT, FILE_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { ListMeta } from "@/lib/types/common";
import type { Company, CompanyListParams, CreateCompanyInput, UpdateCompanyInput } from "@/lib/types/company";

export async function getCompanies(
  params: CompanyListParams = {},
): Promise<{ items: Company[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<Company[]>(COMPANY_ENDPOINT.LIST, {
    searchParams: params,
    skipAuth: true,
    next: { tags: [CACHE_TAG.COMPANIES_LIST] },
  });
  return { items, meta: metadata };
}

export async function getCompanyById(id: string): Promise<Company> {
  return api.get<Company>(COMPANY_ENDPOINT.DETAIL(id), {
    skipAuth: true,
    next: { tags: [CACHE_TAG.COMPANY_DETAIL(id)] },
  });
}

export async function createCompany(input: CreateCompanyInput): Promise<void> {
  await api.post(COMPANY_ENDPOINT.LIST, input);
  revalidatePath(PATH.RECRUITER_COMPANY);
  revalidateTag(CACHE_TAG.COMPANIES_LIST);
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<void> {
  await api.patch(COMPANY_ENDPOINT.DETAIL(id), input);
  revalidatePath(PATH.RECRUITER_COMPANY);
  revalidateTag(CACHE_TAG.COMPANY_DETAIL(id));
  revalidateTag(CACHE_TAG.COMPANIES_LIST);
}

export async function uploadCompanyLogo(id: string, formData: FormData): Promise<void> {
  formData.set("folder", "company-logos");
  const upload = await api.postForm<{ url: string }>(FILE_ENDPOINT.UPLOAD, formData);
  await updateCompany(id, { logoUrl: upload.url });
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(COMPANY_ENDPOINT.DETAIL(id));
  revalidatePath(PATH.RECRUITER_COMPANY);
  revalidateTag(CACHE_TAG.COMPANY_DETAIL(id));
  revalidateTag(CACHE_TAG.COMPANIES_LIST);
}
