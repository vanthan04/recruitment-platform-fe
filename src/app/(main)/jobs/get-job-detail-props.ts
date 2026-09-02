import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyBookmarkedJobIds } from "@/lib/services/bookmark.service";
import { getMyCvs } from "@/lib/services/cv.service";
import { getMyApplications } from "@/lib/services/job-application.service";
import { getJobById } from "@/lib/services/job.service";

// Shared by the full job detail page and its intercepted-modal twin — both
// need the same "is this candidate able to apply/has already applied/has
// this bookmarked" context alongside the job itself.
export async function getJobDetailProps(jobId: string) {
  const [job, user] = await Promise.all([fetchJobOr404(jobId), getCurrentUser()]);

  if (!user) {
    return { job, isLoggedIn: false as const };
  }

  const [bookmarkedJobIds, cvs, applications] = await Promise.all([
    getMyBookmarkedJobIds(),
    getMyCvs(),
    getMyApplications(),
  ]);

  return {
    job,
    isLoggedIn: true as const,
    isBookmarked: bookmarkedJobIds.has(jobId),
    publishedCvs: cvs.filter((cv) => cv.status === "PUBLISHED"),
    hasApplied: applications.some(
      (application) => application.jobId === jobId && application.status !== "WITHDRAWN",
    ),
  };
}

async function fetchJobOr404(id: string) {
  try {
    return await getJobById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
