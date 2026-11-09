"use server";

import { api } from "@/lib/api";
import { INTERVIEW_ENDPOINT } from "@/lib/constants/endpoint";
import type { ListMeta } from "@/lib/types/common";
import type {
  Interview,
  InterviewDetail,
  InterviewListParams,
  InterviewSession,
  RescheduleInterviewInput,
  RoomJoinResult,
  ScheduleInterviewInput,
} from "@/lib/types/interview";

// Callers (recruiter + candidate applications pages) use router.refresh()
// after mutations instead of revalidatePath — same convention already used
// by application-actions.tsx in the same route tree.

export async function getInterviewsForApplication(applicationId: string): Promise<Interview[]> {
  return api.get<Interview[]>(INTERVIEW_ENDPOINT.FOR_APPLICATION(applicationId));
}

// Interviews the signed-in user takes part in (as candidate or as the job's recruiter).
export async function getMyInterviews(
  params: InterviewListParams = {},
): Promise<{ items: InterviewDetail[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<InterviewDetail[]>(INTERVIEW_ENDPOINT.LIST, {
    searchParams: params,
  });
  return { items, meta: metadata };
}

export async function getInterview(id: string): Promise<InterviewDetail> {
  return api.get<InterviewDetail>(INTERVIEW_ENDPOINT.DETAIL(id));
}

export async function getInterviewSessions(id: string): Promise<InterviewSession[]> {
  return api.get<InterviewSession[]>(INTERVIEW_ENDPOINT.SESSIONS(id));
}

// Credentials for the video room — only while a session is open.
export async function getRoomJoinInfo(id: string): Promise<RoomJoinResult> {
  return api.post<RoomJoinResult>(INTERVIEW_ENDPOINT.ROOM_JOIN(id));
}

export async function startInterviewSession(id: string): Promise<InterviewSession> {
  return api.post<InterviewSession>(INTERVIEW_ENDPOINT.SESSIONS(id));
}

export async function endInterviewSession(id: string, sessionId: string): Promise<InterviewSession> {
  return api.patch<InterviewSession>(INTERVIEW_ENDPOINT.END_SESSION(id, sessionId));
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
