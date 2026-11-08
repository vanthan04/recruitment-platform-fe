import type { EmploymentType, JobLevel, WorkMode } from "@/lib/types/job";

/** The slice of a job a recommendation card needs (GET /job-recommendations). */
export interface RecommendedJobSummary {
  id: string;
  title: string;
  location: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  level: JobLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  expiresAt: string | null;
  createdAt: string;
  company: { id: string; name: string; logoUrl: string | null };
}

export interface RecommendedJob {
  job: RecommendedJobSummary;
  /** The job's skills the candidate has, in the job's own spelling. */
  matchedSkills: string[];
  /** The job's skills the candidate doesn't have. */
  missingSkills: string[];
  /** Share of the job's skills covered, 0..1. */
  matchScore: number;
}

export interface JobRecommendations {
  /** False until one of the candidate's published CVs has been analyzed. */
  hasAnalyzedCv: boolean;
  /** The (normalized, lowercase) skills the recommendations were based on. */
  candidateSkills: string[];
  items: RecommendedJob[];
}
