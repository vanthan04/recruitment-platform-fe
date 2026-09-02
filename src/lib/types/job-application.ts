export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

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
}

export interface CreateApplicationInput {
  jobId: string;
  cvId: string;
  coverLetter?: string;
}

export interface ApplicationStats {
  jobId: string;
  viewCount: number;
  totalApplications: number;
  pending: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}
