"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { JOB_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { CreateJobInput, Job, JobListParams, JobMineListParams, UpdateJobInput } from "@/lib/types/job";
import type { ListMeta } from "@/lib/types/common";

export async function getJobs(params: JobListParams = {}): Promise<{ items: Job[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<Job[]>(JOB_ENDPOINT.LIST, {
    searchParams: params,
    skipAuth: true,
    next: { tags: [CACHE_TAG.JOBS_LIST] },
  });
  return { items, meta: metadata };
}

export async function getJobById(id: string): Promise<Job> {
  return api.get<Job>(JOB_ENDPOINT.DETAIL(id), {
    skipAuth: true,
    next: { tags: [CACHE_TAG.JOB_DETAIL(id)] },
  });
}

export async function getRelatedJobs(job: Job, limit = 4): Promise<Job[]> {
  if (!job.categoryId) return [];
  const { items } = await getJobs({ categoryId: job.categoryId, limit: limit + 1 });
  return items.filter((item) => item.id !== job.id).slice(0, limit);
}

export async function getMyJobs(params: JobMineListParams = {}): Promise<{ items: Job[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<Job[]>(JOB_ENDPOINT.MINE, { searchParams: params });
  return { items, meta: metadata };
}

function revalidateJobCaches(id?: string) {
  revalidatePath(PATH.RECRUITER_JOBS);
  revalidateTag(CACHE_TAG.JOBS_LIST);
  if (id) revalidateTag(CACHE_TAG.JOB_DETAIL(id));
}

export async function createJob(input: CreateJobInput): Promise<void> {
  await api.post(JOB_ENDPOINT.LIST, input);
  revalidateJobCaches();
  redirect(PATH.RECRUITER_JOBS);
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<void> {
  await api.patch(JOB_ENDPOINT.DETAIL(id), input);
  revalidateJobCaches(id);
  redirect(PATH.RECRUITER_JOBS);
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(JOB_ENDPOINT.DETAIL(id));
  revalidateJobCaches(id);
}

export async function closeJob(id: string): Promise<void> {
  await api.patch(JOB_ENDPOINT.CLOSE(id));
  revalidateJobCaches(id);
}

export async function reopenJob(id: string): Promise<void> {
  await api.patch(JOB_ENDPOINT.REOPEN(id));
  revalidateJobCaches(id);
}
