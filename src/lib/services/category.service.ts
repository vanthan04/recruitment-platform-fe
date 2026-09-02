"use server";

import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { CATEGORY_ENDPOINT } from "@/lib/constants/endpoint";
import type { Category } from "@/lib/types/category";

export async function getCategories(): Promise<Category[]> {
  return api.get<Category[]>(CATEGORY_ENDPOINT.LIST, {
    skipAuth: true,
    next: { tags: [CACHE_TAG.CATEGORIES_LIST] },
  });
}
