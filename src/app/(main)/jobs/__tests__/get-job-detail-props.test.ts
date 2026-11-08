import { getJobDetailProps } from "../get-job-detail-props";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyBookmarkedJobIds } from "@/lib/services/bookmark.service";
import { getMyCvs } from "@/lib/services/cv.service";
import { getMyApplications } from "@/lib/services/job-application.service";
import { getJobById } from "@/lib/services/job.service";
import type { JobApplication } from "@/lib/types/job-application";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));
jest.mock("@/lib/api", () => ({ ApiError: class ApiError extends Error {} }));
jest.mock("@/lib/services/auth.service", () => ({ getCurrentUser: jest.fn() }));
jest.mock("@/lib/services/bookmark.service", () => ({ getMyBookmarkedJobIds: jest.fn() }));
jest.mock("@/lib/services/cv.service", () => ({ getMyCvs: jest.fn() }));
jest.mock("@/lib/services/job-application.service", () => ({ getMyApplications: jest.fn() }));
jest.mock("@/lib/services/job.service", () => ({ getJobById: jest.fn() }));

const application = (jobId: string, status: JobApplication["status"]): JobApplication => ({
  id: `app-${jobId}`,
  status,
  coverLetter: null,
  userId: "candidate-1",
  jobId,
  cvId: "cv-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("getJobDetailProps — applicationStatus", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (getJobById as jest.Mock).mockResolvedValue({ id: "job-1", title: "Backend" });
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: "candidate-1", role: "CANDIDATE" });
    (getMyBookmarkedJobIds as jest.Mock).mockResolvedValue(new Set<string>());
    (getMyCvs as jest.Mock).mockResolvedValue([]);
  });

  it("is undefined when the candidate has not applied to this job", async () => {
    (getMyApplications as jest.Mock).mockResolvedValue([application("other-job", "APPLIED")]);

    const props = await getJobDetailProps("job-1");

    expect(props).toMatchObject({ isLoggedIn: true, applicationStatus: undefined });
  });

  it.each(["APPLIED", "INTERVIEW", "HIRED", "REJECTED"] as const)(
    "carries the status of the existing application (%s)",
    async (status) => {
      (getMyApplications as jest.Mock).mockResolvedValue([application("job-1", status)]);

      const props = await getJobDetailProps("job-1");

      expect(props).toMatchObject({ applicationStatus: status });
    },
  );

  // Regression: this used to be filtered out, so a withdrawn application read as "never applied"
  // and the apply button came back — which the backend then refused (one application per job, ever).
  it("still reports a WITHDRAWN application instead of pretending there is none", async () => {
    (getMyApplications as jest.Mock).mockResolvedValue([application("job-1", "WITHDRAWN")]);

    const props = await getJobDetailProps("job-1");

    expect(props).toMatchObject({ applicationStatus: "WITHDRAWN" });
  });

  it("looks only at the application for this job", async () => {
    (getMyApplications as jest.Mock).mockResolvedValue([
      application("job-2", "WITHDRAWN"),
      application("job-1", "OFFER"),
      application("job-3", "REJECTED"),
    ]);

    const props = await getJobDetailProps("job-1");

    expect(props).toMatchObject({ applicationStatus: "OFFER" });
  });

  it("gives a logged-out visitor no application state at all", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const props = await getJobDetailProps("job-1");

    expect(props).toEqual({ job: { id: "job-1", title: "Backend" }, isLoggedIn: false });
    expect(getMyApplications).not.toHaveBeenCalled();
  });
});
