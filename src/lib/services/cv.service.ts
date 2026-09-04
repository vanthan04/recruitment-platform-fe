"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CV_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { Cv, CvDownload } from "@/lib/types/cv";

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

// CV creation IS the upload — title + file arrive together as multipart.
export async function createCv(formData: FormData): Promise<void> {
  await api.postForm<Cv>(CV_ENDPOINT.LIST, formData);
  revalidatePath(PATH.CV_LIST);
  redirect(PATH.CV_LIST);
}

export async function updateCvTitle(id: string, title: string): Promise<void> {
  await api.patch(CV_ENDPOINT.DETAIL(id), { title });
  revalidatePath(PATH.CV_LIST);
}

export async function publishCv(id: string): Promise<void> {
  await api.patch(CV_ENDPOINT.PUBLISH(id));
  revalidatePath(PATH.CV_LIST);
}

export async function deleteCv(id: string): Promise<void> {
  await api.delete(CV_ENDPOINT.DETAIL(id));
  revalidatePath(PATH.CV_LIST);
}

// Returns a short-lived presigned S3 URL — the browser downloads directly
// from S3, this call only needs the Bearer cookie to authorize *getting*
// that URL (mirrors the CV's own owner-or-recruiter-via-application check).
export async function getCvDownloadUrl(id: string): Promise<CvDownload> {
  return api.get<CvDownload>(CV_ENDPOINT.DOWNLOAD(id));
}
