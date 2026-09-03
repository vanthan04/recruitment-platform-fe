"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { SAVED_SEARCH_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { CreateSavedSearchInput, SavedSearch } from "@/lib/types/saved-search";

export async function getMySavedSearches(): Promise<SavedSearch[]> {
  return api.get<SavedSearch[]>(SAVED_SEARCH_ENDPOINT.LIST);
}

export async function createSavedSearch(input: CreateSavedSearchInput): Promise<void> {
  await api.post(SAVED_SEARCH_ENDPOINT.LIST, input);
  revalidatePath(PATH.SAVED_SEARCHES);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await api.delete(SAVED_SEARCH_ENDPOINT.DETAIL(id));
  revalidatePath(PATH.SAVED_SEARCHES);
}
