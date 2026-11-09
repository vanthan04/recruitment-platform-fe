"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { MONITORING_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { ListMeta } from "@/lib/types/common";
import type { DetectionEvent, DetectionEventListParams, DetectionSummary } from "@/lib/types/monitoring";

// Monitoring events of an interview: the candidate and the job's recruiter can
// read them (the backend checks); only the recruiter can review.

export async function getDetectionEvents(
  interviewId: string,
  params: DetectionEventListParams = {},
): Promise<{ items: DetectionEvent[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<DetectionEvent[]>(
    MONITORING_ENDPOINT.EVENTS(interviewId),
    {
      searchParams: params,
    },
  );
  return { items, meta: metadata };
}

export async function getDetectionSummary(interviewId: string): Promise<DetectionSummary> {
  return api.get<DetectionSummary>(MONITORING_ENDPOINT.SUMMARY(interviewId));
}

export async function reviewDetectionEvent(
  interviewId: string,
  eventId: string,
  note: string | null,
): Promise<DetectionEvent> {
  const event = await api.patch<DetectionEvent>(MONITORING_ENDPOINT.REVIEW(eventId), note ? { note } : {});
  revalidatePath(PATH.INTERVIEW_MONITORING(interviewId));
  return event;
}
