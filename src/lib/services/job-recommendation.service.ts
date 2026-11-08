"use server";

import { api } from "@/lib/api";
import { JOB_RECOMMENDATION_ENDPOINT } from "@/lib/constants/endpoint";
import type { JobRecommendations } from "@/lib/types/job-recommendation";

// Candidate-only. Matching is done by the backend from the skills its AI
// extracted from the candidate's CVs — no model call per request.
export async function getJobRecommendations(limit = 10): Promise<JobRecommendations> {
  return api.get<JobRecommendations>(JOB_RECOMMENDATION_ENDPOINT.LIST, { searchParams: { limit } });
}
