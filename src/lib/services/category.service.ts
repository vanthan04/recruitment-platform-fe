"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { CATEGORY_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/lib/types/category";

export async function getCategories(): Promise<Category[]> {
  return api.get<Category[]>(CATEGORY_ENDPOINT.LIST, {
    skipAuth: true,
    next: { tags: [CACHE_TAG.CATEGORIES_LIST] },
  });
}

export async function createCategory(input: CreateCategoryInput): Promise<void> {
  await api.post(CATEGORY_ENDPOINT.LIST, input);
  revalidatePath(PATH.ADMIN_CATEGORIES);
  revalidateTag(CACHE_TAG.CATEGORIES_LIST);
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<void> {
  await api.patch(CATEGORY_ENDPOINT.DETAIL(id), input);
  revalidatePath(PATH.ADMIN_CATEGORIES);
  revalidateTag(CACHE_TAG.CATEGORIES_LIST);
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(CATEGORY_ENDPOINT.DETAIL(id));
  revalidatePath(PATH.ADMIN_CATEGORIES);
  revalidateTag(CACHE_TAG.CATEGORIES_LIST);
}
