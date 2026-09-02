"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CV_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { Cv, CvInput } from "@/lib/types/cv";

// Every CV endpoint requires a Bearer token — none are skipAuth.

export async function getMyCvs(): Promise<Cv[]> {
  return api.get<Cv[]>(CV_ENDPOINT.LIST);
}

export async function getCvById(id: string): Promise<Cv | null> {
  try {
    return await api.get<Cv>(CV_ENDPOINT.DETAIL(id));
  } catch (error) {
    // 404 is an expected case (e.g. invalid id in the URL) — bubble up
    // anything else so the error boundary can handle it.
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createCv(input: CvInput): Promise<void> {
  const cv = await api.post<Cv>(CV_ENDPOINT.LIST, input);
  revalidatePath(PATH.CV_LIST);
  redirect(PATH.CV_EDIT(cv.id));
}

export async function updateCv(id: string, input: CvInput): Promise<void> {
  // Full-array-replace: experiences/educations/skills are always sent in
  // full, never partially — the backend replaces, not merges.
  await api.patch(CV_ENDPOINT.DETAIL(id), input);
  revalidatePath(PATH.CV_LIST);
  revalidatePath(PATH.CV_EDIT(id));
}

export async function publishCv(id: string): Promise<void> {
  await api.patch(CV_ENDPOINT.PUBLISH(id));
  revalidatePath(PATH.CV_LIST);
}

export async function deleteCv(id: string): Promise<void> {
  await api.delete(CV_ENDPOINT.DETAIL(id));
  revalidatePath(PATH.CV_LIST);
}

export async function uploadCvFile(id: string, formData: FormData): Promise<void> {
  await api.postForm(CV_ENDPOINT.UPLOAD(id), formData);
  revalidatePath(PATH.CV_LIST);
}
