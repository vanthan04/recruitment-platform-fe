"use server";

import { api } from "@/lib/api";
import { INTERVIEW_ENDPOINT } from "@/lib/constants/endpoint";
import type { Interview, RescheduleInterviewInput, ScheduleInterviewInput } from "@/lib/types/interview";

// Callers (recruiter + candidate applications pages) use router.refresh()
// after mutations instead of revalidatePath — same convention already used
// by application-actions.tsx in the same route tree.

export async function getInterviewsForApplication(applicationId: string): Promise<Interview[]> {
  return api.get<Interview[]>(INTERVIEW_ENDPOINT.FOR_APPLICATION(applicationId));
}

export async function scheduleInterview(input: ScheduleInterviewInput): Promise<void> {
  await api.post(INTERVIEW_ENDPOINT.LIST, input);
}

export async function rescheduleInterview(id: string, input: RescheduleInterviewInput): Promise<void> {
  await api.patch(INTERVIEW_ENDPOINT.DETAIL(id), input);
}

export async function cancelInterview(id: string): Promise<void> {
  await api.patch(INTERVIEW_ENDPOINT.CANCEL(id));
}

export async function completeInterview(id: string): Promise<void> {
  await api.patch(INTERVIEW_ENDPOINT.COMPLETE(id));
}

export async function markInterviewNoShow(id: string): Promise<void> {
  await api.patch(INTERVIEW_ENDPOINT.NO_SHOW(id));
}
