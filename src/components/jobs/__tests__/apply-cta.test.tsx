import { render, screen } from "@testing-library/react";
import { ApplyCta } from "@/components/jobs/job-detail";
import type { Cv } from "@/lib/types/cv";
import type { ApplicationStatus } from "@/lib/types/job-application";

// The dialog pulls in server actions; all that matters here is whether it is offered.
jest.mock("@/components/jobs/apply-dialog", () => ({
  ApplyDialog: () => <button>Ứng tuyển ngay (dialog)</button>,
}));

const cv = { id: "cv-1", title: "My CV", status: "PUBLISHED" } as Cv;

function renderCta(props: Partial<React.ComponentProps<typeof ApplyCta>> = {}) {
  return render(<ApplyCta isLoggedIn isCandidate publishedCvs={[cv]} jobId="job-1" {...props} />);
}

describe("ApplyCta", () => {
  it("offers the apply dialog to a candidate who has not applied", () => {
    renderCta();
    expect(screen.getByRole("button", { name: "Ứng tuyển ngay (dialog)" })).toBeInTheDocument();
  });

  it.each<ApplicationStatus>([
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ])("shows a disabled 'Đã ứng tuyển' once the application is %s", (applicationStatus) => {
    renderCta({ applicationStatus });

    expect(screen.getByRole("button", { name: "Đã ứng tuyển" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /dialog/ })).not.toBeInTheDocument();
  });

  // Regression: the backend allows one application per candidate per job, for good, and
  // refuses another even after a withdrawal. The page used to treat a withdrawn application as
  // "not applied", so the apply button came back and then failed on submit.
  describe("an application that was withdrawn", () => {
    it("does not bring the apply dialog back", () => {
      renderCta({ applicationStatus: "WITHDRAWN" });

      expect(screen.queryByRole("button", { name: /Ứng tuyển/ })).not.toBeInTheDocument();
    });

    it("says it was withdrawn, and why it cannot be redone", () => {
      renderCta({ applicationStatus: "WITHDRAWN" });

      expect(screen.getByRole("button", { name: "Bạn đã rút đơn" })).toBeDisabled();
      expect(screen.getByText(/chỉ được ứng tuyển một lần/)).toBeInTheDocument();
    });
  });

  it("sends a logged-out visitor to log in", () => {
    renderCta({ isLoggedIn: false, isCandidate: undefined });
    expect(screen.getByRole("link", { name: "Ứng tuyển ngay" })).toBeInTheDocument();
  });

  it("shows nothing to a recruiter or admin", () => {
    const { container } = renderCta({ isCandidate: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("points a candidate with no published CV to the CV page instead of the dialog", () => {
    renderCta({ publishedCvs: [] });
    expect(screen.getByRole("link", { name: "Tạo và xuất bản CV để ứng tuyển" })).toBeInTheDocument();
  });
});
