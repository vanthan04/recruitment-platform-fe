"use server";

import { api } from "@/lib/api";
import { CACHE_TAG } from "@/lib/constants/cache-tag";
import { JOB_ENDPOINT } from "@/lib/constants/endpoint";
import type { Job, JobListParams } from "@/lib/types/job";
import type { ListMeta } from "@/lib/types/common";

export async function getJobs(params: JobListParams = {}): Promise<{ items: Job[]; meta?: ListMeta }> {
  const { items, metadata } = await api.jobs.getPaginated<Job[]>(JOB_ENDPOINT.LIST, {
    searchParams: params,
    skipAuth: true,
    next: { tags: [CACHE_TAG.JOBS_LIST] },
  });
  return { items, meta: metadata };
}

export async function getJobById(id: string): Promise<Job> {
  return api.jobs.get<Job>(JOB_ENDPOINT.DETAIL(id), {
    skipAuth: true,
    next: { tags: [CACHE_TAG.JOB_DETAIL(id)] },
  });
}
