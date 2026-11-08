import {
  PIPELINE_COLUMNS,
  canMoveApplication,
  groupApplicationsByStatus,
  isFinalApplicationStatus,
  nextApplicationStatus,
} from "@/lib/utils/application-pipeline";
import type { ApplicationStatus, JobApplication } from "@/lib/types/job-application";

const ALL: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

// Copied from the backend's FORWARD_TRANSITIONS (application-status.vo.ts) — the
// recruiter-driven moves it allows. If the backend's map changes, this is what
// tells the front end to follow.
const BACKEND_ALLOWED: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ["SCREENING", "REJECTED"],
  SCREENING: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

describe("canMoveApplication", () => {
  it("agrees with the backend's transition map for every from/to pair", () => {
    for (const from of ALL) {
      for (const to of ALL) {
        expect({ from, to, allowed: canMoveApplication(from, to) }).toEqual({
          from,
          to,
          allowed: BACKEND_ALLOWED[from].includes(to),
        });
      }
    }
  });

  it("allows exactly one step forward", () => {
    expect(canMoveApplication("APPLIED", "SCREENING")).toBe(true);
    expect(canMoveApplication("OFFER", "HIRED")).toBe(true);
  });

  it("refuses to skip a step or go backwards", () => {
    expect(canMoveApplication("APPLIED", "SHORTLISTED")).toBe(false);
    expect(canMoveApplication("APPLIED", "HIRED")).toBe(false);
    expect(canMoveApplication("INTERVIEW", "SCREENING")).toBe(false);
  });

  it.each<ApplicationStatus>(["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER"])(
    "allows rejecting from %s",
    (from) => {
      expect(canMoveApplication(from, "REJECTED")).toBe(true);
    },
  );

  it.each<ApplicationStatus>(["HIRED", "REJECTED", "WITHDRAWN"])(
    "lets nothing move out of the final status %s",
    (from) => {
      for (const to of ALL) expect(canMoveApplication(from, to)).toBe(false);
    },
  );

  it("never lets a recruiter move into WITHDRAWN (it is the candidate's own action)", () => {
    for (const from of ALL) expect(canMoveApplication(from, "WITHDRAWN")).toBe(false);
  });

  it("is not a move to stay where you are", () => {
    for (const status of ALL) expect(canMoveApplication(status, status)).toBe(false);
  });
});

describe("nextApplicationStatus", () => {
  it("is the one forward step", () => {
    expect(nextApplicationStatus("APPLIED")).toBe("SCREENING");
    expect(nextApplicationStatus("SCREENING")).toBe("SHORTLISTED");
    expect(nextApplicationStatus("SHORTLISTED")).toBe("INTERVIEW");
    expect(nextApplicationStatus("INTERVIEW")).toBe("OFFER");
    expect(nextApplicationStatus("OFFER")).toBe("HIRED");
  });

  it.each<ApplicationStatus>(["HIRED", "REJECTED", "WITHDRAWN"])(
    "is undefined for the final status %s",
    (status) => {
      expect(nextApplicationStatus(status)).toBeUndefined();
    },
  );
});

describe("isFinalApplicationStatus", () => {
  it.each<ApplicationStatus>(["HIRED", "REJECTED", "WITHDRAWN"])("is true for %s", (status) => {
    expect(isFinalApplicationStatus(status)).toBe(true);
  });

  it.each<ApplicationStatus>(["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER"])(
    "is false for %s",
    (status) => {
      expect(isFinalApplicationStatus(status)).toBe(false);
    },
  );
});

describe("PIPELINE_COLUMNS", () => {
  it("has one column for every status, in pipeline order, with the candidate-driven WITHDRAWN last", () => {
    expect(PIPELINE_COLUMNS).toEqual(ALL);
  });
});

describe("groupApplicationsByStatus", () => {
  const app = (id: string, status: ApplicationStatus): JobApplication => ({
    id,
    status,
    coverLetter: null,
    userId: `u-${id}`,
    jobId: "job-1",
    cvId: `cv-${id}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  it("buckets each application under its status and keeps their order", () => {
    const groups = groupApplicationsByStatus([app("a", "APPLIED"), app("b", "OFFER"), app("c", "APPLIED")]);

    expect(groups.APPLIED.map((a) => a.id)).toEqual(["a", "c"]);
    expect(groups.OFFER.map((a) => a.id)).toEqual(["b"]);
  });

  it("includes every column, empty ones too, so the board always shows the whole pipeline", () => {
    const groups = groupApplicationsByStatus([]);

    expect(Object.keys(groups)).toEqual(ALL);
    for (const status of ALL) expect(groups[status]).toEqual([]);
  });
});
