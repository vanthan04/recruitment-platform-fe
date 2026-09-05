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
