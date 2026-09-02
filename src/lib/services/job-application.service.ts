"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { JOB_APPLICATION_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { AuthActionResult } from "@/lib/types/auth";
import type { ApplicationStats, CreateApplicationInput, JobApplication } from "@/lib/types/job-application";

export async function applyToJob(input: CreateApplicationInput): Promise<AuthActionResult> {
  try {
    await api.post(JOB_APPLICATION_ENDPOINT.LIST, input);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Ứng tuyển thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.APPLICATIONS);
  return {};
}

export async function getMyApplications(): Promise<JobApplication[]> {
  return api.get<JobApplication[]>(JOB_APPLICATION_ENDPOINT.MY_APPLICATIONS);
}

export async function withdrawApplication(id: string): Promise<AuthActionResult> {
  try {
    await api.patch(JOB_APPLICATION_ENDPOINT.WITHDRAW(id));
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Rút đơn thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.APPLICATIONS);
  return {};
}

export async function getApplicationsForJob(jobId: string): Promise<JobApplication[]> {
  return api.get<JobApplication[]>(JOB_APPLICATION_ENDPOINT.FOR_JOB(jobId));
}

export async function getApplicationStats(jobId: string): Promise<ApplicationStats> {
  return api.get<ApplicationStats>(JOB_APPLICATION_ENDPOINT.STATS(jobId));
}

export async function updateApplicationStatus(
  id: string,
  status: "ACCEPTED" | "REJECTED",
): Promise<AuthActionResult> {
  try {
    await api.patch(JOB_APPLICATION_ENDPOINT.STATUS(id), { status });
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : "Cập nhật trạng thái thất bại, vui lòng thử lại.",
    };
  }

  return {};
}
