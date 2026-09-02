"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { BOOKMARK_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import { getJobById } from "@/lib/services/job.service";
import type { Bookmark } from "@/lib/types/bookmark";
import type { Job } from "@/lib/types/job";

export async function toggleBookmark(jobId: string): Promise<void> {
  await api.post(BOOKMARK_ENDPOINT.TOGGLE(jobId));
  revalidatePath(PATH.SAVED_JOBS);
}

// GET /bookmarks doesn't include job details (per API guide) — this just
// resolves the ids so pages can mark which JobCards are bookmarked.
export async function getMyBookmarkedJobIds(): Promise<Set<string>> {
  try {
    const bookmarks = await api.get<Bookmark[]>(BOOKMARK_ENDPOINT.LIST);
    return new Set(bookmarks.map((bookmark) => bookmark.jobId));
  } catch {
    // Used in sidebars/headers — fail silently so it doesn't crash unrelated pages.
    return new Set();
  }
}

export async function getMyBookmarkedJobs(): Promise<Job[]> {
  const bookmarks = await api.get<Bookmark[]>(BOOKMARK_ENDPOINT.LIST);
  const jobs = await Promise.all(bookmarks.map((bookmark) => getJobById(bookmark.jobId).catch(() => null)));
  return jobs.filter((job): job is Job => job !== null);
}
