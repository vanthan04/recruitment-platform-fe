import type { ApplicationStatus } from "@/lib/types/job-application";

/**
 * Application statuses at which a recruiter is offered the interview panel
 * (schedule / reschedule / cancel / complete / no-show).
 *
 * The backend allows any non-terminal status (it refuses only HIRED, REJECTED
 * and WITHDRAWN — see ensure-application-interviewable.util.ts); this is
 * deliberately narrower: from the moment a candidate is shortlisted until the
 * offer, which is where interviews belong in the pipeline. Widen it here if
 * you want interviews earlier (e.g. SCREENING) — nothing else depends on it.
 *
 * It must never include HIRED/REJECTED/WITHDRAWN: the backend refuses every
 * interview action for those, so the panel's buttons would only produce
 * errors. (The pages used to show the panel only for HIRED — a status the
 * backend refuses — which is why no interview could be scheduled from the UI.)
 */
export const INTERVIEW_SCHEDULABLE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
];

/** Whether the recruiter can act on interviews for an application in this status. */
export function canScheduleInterview(status: ApplicationStatus): boolean {
  return INTERVIEW_SCHEDULABLE_APPLICATION_STATUSES.includes(status);
}

/**
 * Whether an interview may exist (and so is worth fetching and showing) for an
 * application in this status: while one can be scheduled, and after the hire,
 * where it stays visible as history but can no longer be changed.
 *
 * Both the recruiter's and the candidate's application lists use this to skip
 * the per-application interview request for everything else.
 */
export function mayHaveInterview(status: ApplicationStatus): boolean {
  return canScheduleInterview(status) || status === "HIRED";
}
