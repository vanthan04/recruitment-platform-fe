import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { PATH } from "@/lib/constants/path";
import {
  createCv,
  deleteCv,
  getCvById,
  getCvDownloadUrl,
  getMyCvs,
  publishCv,
  updateCvTitle,
} from "@/lib/services/cv.service";
import type { Cv } from "@/lib/types/cv";

jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api/error");
  return {
    api: { get: jest.fn(), post: jest.fn(), postForm: jest.fn(), patch: jest.fn(), delete: jest.fn() },
    ApiError: actual.ApiError,
  };
});
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

const mockedGet = api.get as jest.Mock;
const mockedPostForm = api.postForm as jest.Mock;
const mockedPatch = api.patch as jest.Mock;
const mockedDelete = api.delete as jest.Mock;
const mockedRevalidatePath = revalidatePath as jest.Mock;
const mockedRedirect = redirect as unknown as jest.Mock;

const cv: Cv = {
  id: "cv-1",
  title: "My CV",
  originalName: "resume.pdf",
  fileType: "PDF",
  mimeType: "application/pdf",
  fileSize: 1024,
  status: "PUBLISHED",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  userId: "user-1",
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("getMyCvs", () => {
  it("fetches the candidate's own CV list", async () => {
    mockedGet.mockResolvedValue([cv]);

    await expect(getMyCvs()).resolves.toEqual([cv]);
    expect(mockedGet).toHaveBeenCalledWith("/cvs");
  });
});

describe("getCvById", () => {
  it("returns the CV on success", async () => {
    mockedGet.mockResolvedValue(cv);

    await expect(getCvById("cv-1")).resolves.toEqual(cv);
    expect(mockedGet).toHaveBeenCalledWith("/cvs/cv-1");
  });

  it("returns null for a 404 (e.g. an invalid id in the URL) instead of throwing", async () => {
    mockedGet.mockRejectedValue(new ApiError("Not Found", 404));

    await expect(getCvById("missing")).resolves.toBeNull();
  });

  it("rethrows a non-404 ApiError so the error boundary can handle it", async () => {
    mockedGet.mockRejectedValue(new ApiError("Forbidden", 403));

    await expect(getCvById("cv-1")).rejects.toMatchObject({ status: 403 });
  });

  it("rethrows a non-ApiError failure", async () => {
    mockedGet.mockRejectedValue(new Error("network down"));

    await expect(getCvById("cv-1")).rejects.toThrow("network down");
  });
});

describe("createCv", () => {
  it("uploads the form data, revalidates, and redirects to the CV list", async () => {
    mockedPostForm.mockResolvedValue(cv);
    const formData = new FormData();

    await createCv(formData);

    expect(mockedPostForm).toHaveBeenCalledWith("/cvs", formData);
    expect(mockedRevalidatePath).toHaveBeenCalledWith(PATH.CV_LIST);
    expect(mockedRedirect).toHaveBeenCalledWith(PATH.CV_LIST);
  });

  it("does not revalidate or redirect when the upload itself fails", async () => {
    mockedPostForm.mockRejectedValue(new Error("file too large"));

    await expect(createCv(new FormData())).rejects.toThrow("file too large");
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
    expect(mockedRedirect).not.toHaveBeenCalled();
  });
});

describe("updateCvTitle", () => {
  it("patches the new title and revalidates the CV list", async () => {
    mockedPatch.mockResolvedValue(undefined);

    await updateCvTitle("cv-1", "New title");

    expect(mockedPatch).toHaveBeenCalledWith("/cvs/cv-1", { title: "New title" });
    expect(mockedRevalidatePath).toHaveBeenCalledWith(PATH.CV_LIST);
  });
});

describe("publishCv", () => {
  it("patches the publish endpoint and revalidates the CV list", async () => {
    mockedPatch.mockResolvedValue(undefined);

    await publishCv("cv-1");

    expect(mockedPatch).toHaveBeenCalledWith("/cvs/cv-1/publish");
    expect(mockedRevalidatePath).toHaveBeenCalledWith(PATH.CV_LIST);
  });
});

describe("deleteCv", () => {
  it("deletes the CV and revalidates the CV list", async () => {
    mockedDelete.mockResolvedValue(undefined);

    await deleteCv("cv-1");

    expect(mockedDelete).toHaveBeenCalledWith("/cvs/cv-1");
    expect(mockedRevalidatePath).toHaveBeenCalledWith(PATH.CV_LIST);
  });
});

describe("getCvDownloadUrl", () => {
  it("fetches a presigned download URL for the given CV id", async () => {
    const download = { url: "https://s3.example.com/cv-1", expiresAt: "2026-01-01T00:05:00.000Z" };
    mockedGet.mockResolvedValue(download);

    await expect(getCvDownloadUrl("cv-1")).resolves.toEqual(download);
    expect(mockedGet).toHaveBeenCalledWith("/cvs/cv-1/download");
  });
});
