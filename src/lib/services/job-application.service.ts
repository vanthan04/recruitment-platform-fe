"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { JOB_APPLICATION_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { ApplicationStats, CreateApplicationInput, JobApplication } from "@/lib/types/job-application";

export async function applyToJob(input: CreateApplicationInput): Promise<void> {
  await api.post(JOB_APPLICATION_ENDPOINT.LIST, input);
  revalidatePath(PATH.APPLICATIONS);
}

export async function getMyApplications(): Promise<JobApplication[]> {
  return api.get<JobApplication[]>(JOB_APPLICATION_ENDPOINT.MY_APPLICATIONS);
}

export async function withdrawApplication(id: string): Promise<void> {
  await api.patch(JOB_APPLICATION_ENDPOINT.WITHDRAW(id));
  revalidatePath(PATH.APPLICATIONS);
}

export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  return api.get<JobApplication[]>(JOB_APPLICATION_ENDPOINT.FOR_JOB(jobId));
}

export async function getApplicationStats(jobId: string): Promise<ApplicationStats> {
  return api.get<ApplicationStats>(JOB_APPLICATION_ENDPOINT.STATS(jobId));
}

export async function updateApplicationStatus(id: string, status: "ACCEPTED" | "REJECTED"): Promise<void> {
  await api.patch(JOB_APPLICATION_ENDPOINT.STATUS(id), { status });
}
