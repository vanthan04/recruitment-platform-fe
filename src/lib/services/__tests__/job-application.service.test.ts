import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { PATH } from "@/lib/constants/path";
import {
  applyToJob,
  getApplicationHistory,
  getApplicationStats,
  getApplicationsForJob,
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "@/lib/services/job-application.service";
import type { ApplicationStats, CreateApplicationInput, JobApplication } from "@/lib/types/job-application";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockedGet = api.get as jest.Mock;
const mockedPost = api.post as jest.Mock;
const mockedPatch = api.patch as jest.Mock;
const mockedRevalidatePath = revalidatePath as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe("applyToJob", () => {
  it("posts to the job-applications endpoint and revalidates the applications list", async () => {
    const input: CreateApplicationInput = { jobId: "job-1", cvId: "cv-1", coverLetter: "Hi" };
    mockedPost.mockResolvedValue(undefined);

    await applyToJob(input);

    expect(mockedPost).toHaveBeenCalledWith("/job-applications", input);
    expect(mockedRevalidatePath).toHaveBeenCalledWith(PATH.APPLICATIONS);
  });

  it("does not swallow a failed application submission", async () => {
    mockedPost.mockRejectedValue(new Error("job already closed"));

    await expect(applyToJob({ jobId: "job-1", cvId: "cv-1" })).rejects.toThrow("job already closed");
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("getMyApplications", () => {
  it("fetches the candidate's own applications", async () => {
    const applications: JobApplication[] = [
      {
        id: "app-1",
        status: "APPLIED",
        coverLetter: null,
        userId: "user-1",
        jobId: "job-1",
        cvId: "cv-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    mockedGet.mockResolvedValue(applications);

    await expect(getMyApplications()).resolves.toEqual(applications);
    expect(mockedGet).toHaveBeenCalledWith("/job-applications/my-applications");
  });
});

describe("withdrawApplication", () => {
  it("patches the withdraw endpoint for the given id and revalidates", async () => {
    mockedPatch.mockResolvedValue(undefined);

    await withdrawApplication("app-1");

    expect(mockedPatch).toHaveBeenCalledWith("/job-applications/app-1/withdraw");
    expect(mockedRevalidatePath).toHaveBeenCalledWith(PATH.APPLICATIONS);
  });
});

describe("getApplicationsForJob", () => {
  it("fetches applications scoped to the given job id (recruiter view)", async () => {
    mockedGet.mockResolvedValue([]);

    await getApplicationsForJob("job-1");

    expect(mockedGet).toHaveBeenCalledWith("/job-applications/job/job-1");
  });
});

describe("getApplicationStats", () => {
  it("fetches stats scoped to the given job id", async () => {
    const stats: ApplicationStats = {
      jobId: "job-1",
      viewCount: 10,
      totalApplications: 2,
      applied: 1,
      screening: 1,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };
    mockedGet.mockResolvedValue(stats);

    await expect(getApplicationStats("job-1")).resolves.toEqual(stats);
    expect(mockedGet).toHaveBeenCalledWith("/job-applications/job/job-1/stats");
  });
});

describe("getApplicationHistory", () => {
  it("fetches the status-change history for a single application", async () => {
    mockedGet.mockResolvedValue([]);

    await getApplicationHistory("app-1");

    expect(mockedGet).toHaveBeenCalledWith("/job-applications/app-1/history");
  });
});

describe("updateApplicationStatus", () => {
  it("patches status without a note when none is given", async () => {
    mockedPatch.mockResolvedValue(undefined);

    await updateApplicationStatus("app-1", "SHORTLISTED");

    expect(mockedPatch).toHaveBeenCalledWith("/job-applications/app-1/status", {
      status: "SHORTLISTED",
      note: undefined,
    });
  });

  it("patches status with a note when given", async () => {
    mockedPatch.mockResolvedValue(undefined);

    await updateApplicationStatus("app-1", "REJECTED", "Not enough experience");

    expect(mockedPatch).toHaveBeenCalledWith("/job-applications/app-1/status", {
      status: "REJECTED",
      note: "Not enough experience",
    });
  });
});
