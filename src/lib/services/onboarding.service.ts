"use server";

import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { createCompany } from "@/lib/services/company.service";
import { updateProfile } from "@/lib/services/auth.service";
import type { Gender } from "@/lib/types/auth";

export interface CompleteRecruiterOnboardingInput {
  fullName: string;
  phoneNumber: string;
  gender: Gender;
  companyName: string;
  province: string;
  ward?: string;
}

export async function completeRecruiterOnboarding(input: CompleteRecruiterOnboardingInput): Promise<void> {
  await updateProfile({
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    gender: input.gender,
  });
  await createCompany({
    name: input.companyName,
    province: input.province,
    ward: input.ward || undefined,
  });
  redirect(PATH.RECRUITER_JOBS);
}
