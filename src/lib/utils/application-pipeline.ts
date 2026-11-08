import {
  NON_TERMINAL_APPLICATION_STATUSES,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/types/job-application";

/**
 * The recruiter-facing hiring pipeline, mirroring the backend's transition map
 * (application-status.vo.ts): strictly one step forward at a time —
 *
 *   APPLIED → SCREENING → SHORTLISTED → INTERVIEW → OFFER → HIRED
 *
 * — with REJECTED reachable from any step that isn't already final. HIRED,
 * REJECTED and WITHDRAWN are final (nothing moves out of them). WITHDRAWN is
 * the candidate's own action, so a recruiter can never move *into* it.
 *
 * The backend is the authority and re-checks every move; this exists so the UI
 * only offers moves it will accept.
 */
const NEXT_STATUS: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  APPLIED: "SCREENING",
  SCREENING: "SHORTLISTED",
  SHORTLISTED: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: "HIRED",
};

/** The one forward step from this status, or undefined when it has none (a final status). */
export function nextApplicationStatus(status: ApplicationStatus): ApplicationStatus | undefined {
  return NEXT_STATUS[status];
}

/** Whether a recruiter may move an application from one status to another. */
export function canMoveApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return false;
  if (to === "REJECTED") return NON_TERMINAL_APPLICATION_STATUSES.includes(from);
  return NEXT_STATUS[from] === to;
}

/** Statuses that end the process: the move can't be undone, so it deserves a confirmation. */
export function isFinalApplicationStatus(status: ApplicationStatus): boolean {
  return !NON_TERMINAL_APPLICATION_STATUSES.includes(status);
}

/** Board columns, left to right. WITHDRAWN is last and read-only — shown so those applications don't vanish from the board. */
export const PIPELINE_COLUMNS: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

/**
 * The DOM id the list view gives each application's card, so the board can
 * deep-link to it. Lives here, not in the board component: the board is a
 * client component, and a server component (the page) can't call a function
 * exported from one.
 */
export const applicationAnchorId = (applicationId: string) => `application-${applicationId}`;

/** Applications bucketed by status; every column is present, even when empty. */
export function groupApplicationsByStatus(
  applications: JobApplication[],
): Record<ApplicationStatus, JobApplication[]> {
  const groups = Object.fromEntries(
    PIPELINE_COLUMNS.map((status) => [status, [] as JobApplication[]]),
  ) as Record<ApplicationStatus, JobApplication[]>;
  for (const application of applications) {
    groups[application.status].push(application);
  }
  return groups;
}
