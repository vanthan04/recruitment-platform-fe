"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CV_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { AuthActionResult } from "@/lib/types/auth";
import type { Cv, CvInput } from "@/lib/types/cv";

// Every CV endpoint requires a Bearer token — none are skipAuth.

export async function getMyCvs(): Promise<Cv[]> {
  return api.get<Cv[]>(CV_ENDPOINT.LIST);
}

export async function getCvById(id: string): Promise<Cv | null> {
  try {
    return await api.get<Cv>(CV_ENDPOINT.DETAIL(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createCv(input: CvInput): Promise<AuthActionResult> {
  let cv: Cv;
  try {
    cv = await api.post<Cv>(CV_ENDPOINT.LIST, input);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Tạo CV thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.CV_LIST);
  redirect(PATH.CV_EDIT(cv.id));
}

export async function updateCv(id: string, input: CvInput): Promise<AuthActionResult> {
  try {
    // Full-array-replace: experiences/educations/skills are always sent in
    // full, never partially — the backend replaces, not merges.
    await api.patch(CV_ENDPOINT.DETAIL(id), input);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Cập nhật CV thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.CV_LIST);
  revalidatePath(PATH.CV_EDIT(id));
  return {};
}

export async function publishCv(id: string): Promise<AuthActionResult> {
  try {
    await api.patch(CV_ENDPOINT.PUBLISH(id));
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Xuất bản CV thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.CV_LIST);
  return {};
}

export async function deleteCv(id: string): Promise<AuthActionResult> {
  try {
    await api.delete(CV_ENDPOINT.DETAIL(id));
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Xoá CV thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.CV_LIST);
  return {};
}

export async function uploadCvFile(id: string, formData: FormData): Promise<AuthActionResult> {
  try {
    await api.postForm(CV_ENDPOINT.UPLOAD(id), formData);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Tải file CV thất bại, vui lòng thử lại." };
  }

  revalidatePath(PATH.CV_LIST);
  return {};
}
