export type InterviewStatus = "SCHEDULED" | "RESCHEDULED" | "CANCELLED";

export interface Interview {
  id: string;
  jobApplicationId: string;
  scheduledAt: string;
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
}

export interface RescheduleInterviewInput {
  scheduledAt?: string;
  location?: string;
  meetingLink?: string;
  note?: string;
}
