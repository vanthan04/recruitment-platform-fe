export type InterviewStatus = "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export const NON_TERMINAL_INTERVIEW_STATUSES: InterviewStatus[] = ["SCHEDULED", "RESCHEDULED"];

export interface Interview {
  id: string;
  jobApplicationId: string;
  scheduledAt: string;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
  status: InterviewStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInterviewInput {
  jobApplicationId: string;
  scheduledAt: string;
  location?: string;
  meetingLink?: string;
  note?: string;
  durationMinutes?: number;
}

export interface RescheduleInterviewInput {
  scheduledAt?: string;
  location?: string;
  meetingLink?: string;
  note?: string;
  durationMinutes?: number;
}

export type InterviewViewerRole = "CANDIDATE" | "RECRUITER";

/** An interview plus the context a list/detail screen needs (GET /interviews, GET /interviews/:id). */
export interface InterviewDetail extends Interview {
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string | null;
  /** The signed-in user's role in this interview. */
  viewerRole: InterviewViewerRole;
}

export interface InterviewSession {
  id: string;
  interviewId: string;
  startedAt: string;
  endedAt: string | null;
  startedById: string | null;
  status: "IN_PROGRESS" | "ENDED";
}

export interface InterviewListParams {
  page?: number;
  limit?: number;
  status?: InterviewStatus;
  /** Only pending interviews that have not started yet, soonest first. */
  upcoming?: boolean;
}
