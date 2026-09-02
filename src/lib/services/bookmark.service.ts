"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { BOOKMARK_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import { getJobById } from "@/lib/services/job.service";
import type { Bookmark } from "@/lib/types/bookmark";
import type { Job } from "@/lib/types/job";

export async function toggleBookmark(jobId: string): Promise<{ bookmarked: boolean } | { error: string }> {
  try {
    const result = await api.post<{ bookmarked: boolean }>(BOOKMARK_ENDPOINT.TOGGLE(jobId));
    revalidatePath(PATH.SAVED_JOBS);
    return result;
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Lưu tin thất bại, vui lòng thử lại." };
  }
}

// GET /bookmarks doesn't include job details (per API guide) — this just
// resolves the ids so pages can mark which JobCards are bookmarked.
export async function getMyBookmarkedJobIds(): Promise<Set<string>> {
  try {
    const bookmarks = await api.get<Bookmark[]>(BOOKMARK_ENDPOINT.LIST);
    return new Set(bookmarks.map((bookmark) => bookmark.jobId));
  } catch {
    return new Set();
  }
}

export async function getMyBookmarkedJobs(): Promise<Job[]> {
  const bookmarks = await api.get<Bookmark[]>(BOOKMARK_ENDPOINT.LIST);
  const jobs = await Promise.all(bookmarks.map((bookmark) => getJobById(bookmark.jobId).catch(() => null)));
  return jobs.filter((job): job is Job => job !== null);
}
