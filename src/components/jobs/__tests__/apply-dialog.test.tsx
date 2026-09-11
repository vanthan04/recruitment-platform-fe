import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { applyToJob } from "@/lib/services/job-application.service";
import type { Cv } from "@/lib/types/cv";
import { ApplyDialog } from "../apply-dialog";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("@/lib/services/job-application.service", () => ({
  applyToJob: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedApplyToJob = applyToJob as jest.Mock;

const mockCv: Cv = {
  id: "cv-1",
  title: "CV Backend Developer",
  originalName: "cv.pdf",
  fileType: "PDF",
  mimeType: "application/pdf",
  fileSize: 1024,
  status: "PUBLISHED",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: "user-1",
};

describe("ApplyDialog", () => {
  beforeEach(() => {
    mockedApplyToJob.mockClear();
  });

  it("applies with the pre-selected CV and no cover letter", async () => {
    const user = userEvent.setup();
    render(<ApplyDialog jobId="job-1" cvs={[mockCv]} />);

    await user.click(screen.getByRole("button", { name: "Ứng tuyển ngay" }));
    await user.click(screen.getByRole("button", { name: "Nộp đơn" }));

    await waitFor(() =>
      expect(mockedApplyToJob).toHaveBeenCalledWith({
        jobId: "job-1",
        cvId: "cv-1",
        coverLetter: undefined,
      }),
    );
  });

  it("includes the cover letter when one is entered", async () => {
    const user = userEvent.setup();
    render(<ApplyDialog jobId="job-1" cvs={[mockCv]} />);

    await user.click(screen.getByRole("button", { name: "Ứng tuyển ngay" }));
    await user.type(screen.getByLabelText(/Thư giới thiệu/), "Tôi rất quan tâm đến vị trí này.");
    await user.click(screen.getByRole("button", { name: "Nộp đơn" }));

    await waitFor(() =>
      expect(mockedApplyToJob).toHaveBeenCalledWith({
        jobId: "job-1",
        cvId: "cv-1",
        coverLetter: "Tôi rất quan tâm đến vị trí này.",
      }),
    );
  });

  it("disables the submit button when the candidate has no CV to select", async () => {
    const user = userEvent.setup();
    render(<ApplyDialog jobId="job-1" cvs={[]} />);

    await user.click(screen.getByRole("button", { name: "Ứng tuyển ngay" }));

    expect(screen.getByRole("button", { name: "Nộp đơn" })).toBeDisabled();
    expect(mockedApplyToJob).not.toHaveBeenCalled();
  });
});
