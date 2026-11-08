"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { JOB_APPLICATION_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type {
  ApplicationNote,
  ApplicationStatus,
  ApplicationStats,
  ApplicationStatusHistoryEntry,
  CreateApplicationInput,
  JobApplication,
} from "@/lib/types/job-application";

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

export async function getApplicationHistory(id: string): Promise<ApplicationStatusHistoryEntry[]> {
  return api.get<ApplicationStatusHistoryEntry[]>(JOB_APPLICATION_ENDPOINT.HISTORY(id));
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  note?: string,
): Promise<void> {
  await api.patch(JOB_APPLICATION_ENDPOINT.STATUS(id), { status, note });
}

// ── Recruiter-private review data (job owner only; the backend enforces it) ──

export async function getApplicationNotes(id: string): Promise<ApplicationNote[]> {
  return api.get<ApplicationNote[]>(JOB_APPLICATION_ENDPOINT.NOTES(id));
}

export async function addApplicationNote(id: string, content: string): Promise<ApplicationNote> {
  return api.post<ApplicationNote>(JOB_APPLICATION_ENDPOINT.NOTES(id), { content });
}

export async function deleteApplicationNote(id: string, noteId: string): Promise<void> {
  await api.delete(JOB_APPLICATION_ENDPOINT.NOTE(id, noteId));
}

export async function setApplicationStarred(id: string, starred: boolean): Promise<{ isStarred: boolean }> {
  return api.patch<{ isStarred: boolean }>(JOB_APPLICATION_ENDPOINT.STAR(id), { starred });
}
