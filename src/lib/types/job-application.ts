export type ApplicationStatus =
  "APPLIED" | "SCREENING" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN";

export const NON_TERMINAL_APPLICATION_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
];

// Mirrors the backend's CHAT_ELIGIBLE_APPLICATION_STATUSES
// (chat-eligible-application-status.vo.ts): a recruiter can open a
// conversation from the moment an application is shortlisted until it ends
// in a hire. The backend enforces this; the list only decides whether to
// show the "Nhắn tin" button.
export const CHAT_ELIGIBLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
];

export interface ApplicationCandidateSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface JobApplication {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  userId: string;
  jobId: string;
  cvId: string;
  createdAt: string;
  updatedAt: string;
  /** Only populated by GET /job-applications/job/:jobId (recruiter view). */
  candidate?: ApplicationCandidateSummary;
  /** Recruiter-private; only in the recruiter's list for their job (never sent to the candidate). */
  isStarred?: boolean;
}

/** An internal note the job's recruiter keeps on an application. Never shown to the candidate. */
export interface ApplicationNote {
  id: string;
  content: string;
  /** Null once the author's account has been deleted. */
  authorId: string | null;
  createdAt: string;
}

/** Mirrors the backend's APPLICATION_NOTE_MAX_LENGTH. */
export const APPLICATION_NOTE_MAX_LENGTH = 2000;

export interface CreateApplicationInput {
  jobId: string;
  cvId: string;
  coverLetter?: string;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  changedById: string | null;
  createdAt: string;
}

export interface ApplicationStats {
  jobId: string;
  viewCount: number;
  totalApplications: number;
  applied: number;
  screening: number;
  shortlisted: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  withdrawn: number;
}
