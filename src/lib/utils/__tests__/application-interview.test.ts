import {
  INTERVIEW_SCHEDULABLE_APPLICATION_STATUSES,
  canScheduleInterview,
  mayHaveInterview,
} from "@/lib/utils/application-interview";
import type { ApplicationStatus } from "@/lib/types/job-application";

const ALL_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

// The backend refuses every interview action for these (ensureApplicationInterviewable).
const BACKEND_REFUSES: ApplicationStatus[] = ["HIRED", "REJECTED", "WITHDRAWN"];

describe("canScheduleInterview", () => {
  it.each<ApplicationStatus>(["SHORTLISTED", "INTERVIEW", "OFFER"])(
    "is true while the application is %s",
    (status) => {
      expect(canScheduleInterview(status)).toBe(true);
    },
  );

  it.each<ApplicationStatus>(["APPLIED", "SCREENING", "HIRED", "REJECTED", "WITHDRAWN"])(
    "is false when the application is %s",
    (status) => {
      expect(canScheduleInterview(status)).toBe(false);
    },
  );

  // Regression: the panel used to be shown only for HIRED, a status the backend
  // refuses — so an interview could not be scheduled from the UI at all.
  it("never offers interview actions for a status the backend refuses", () => {
    for (const status of BACKEND_REFUSES) {
      expect(canScheduleInterview(status)).toBe(false);
      expect(INTERVIEW_SCHEDULABLE_APPLICATION_STATUSES).not.toContain(status);
    }
  });

  it("offers it for at least one status (the feature is reachable)", () => {
    expect(ALL_STATUSES.some(canScheduleInterview)).toBe(true);
  });
});

describe("mayHaveInterview", () => {
  it("covers every schedulable status", () => {
    for (const status of INTERVIEW_SCHEDULABLE_APPLICATION_STATUSES) {
      expect(mayHaveInterview(status)).toBe(true);
    }
  });

  it("also covers HIRED, so an interview stays visible as history after the hire", () => {
    expect(mayHaveInterview("HIRED")).toBe(true);
  });

  it.each<ApplicationStatus>(["APPLIED", "SCREENING", "REJECTED", "WITHDRAWN"])(
    "skips %s — no interview request is made for it",
    (status) => {
      expect(mayHaveInterview(status)).toBe(false);
    },
  );
});
