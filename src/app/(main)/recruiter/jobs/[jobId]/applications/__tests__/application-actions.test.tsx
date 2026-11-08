import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplicationActions } from "../application-actions";
import { startConversationAndRedirect } from "@/lib/services/chat.service";
import type { ApplicationStatus, JobApplication } from "@/lib/types/job-application";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));

jest.mock("@/lib/services/chat.service", () => ({
  startConversationAndRedirect: jest.fn(),
}));

jest.mock("@/lib/services/job-application.service", () => ({
  updateApplicationStatus: jest.fn(),
}));

jest.mock("@/lib/services/auth.service", () => ({
  logout: jest.fn(),
}));

function makeApplication(status: ApplicationStatus): JobApplication {
  return {
    id: "app-1",
    status,
    coverLetter: null,
    userId: "candidate-1",
    jobId: "job-1",
    cvId: "cv-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("ApplicationActions — Nhắn tin button", () => {
  it.each<ApplicationStatus>(["SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"])(
    "is offered when the application is %s",
    (status) => {
      render(<ApplicationActions application={makeApplication(status)} />);
      expect(screen.getByRole("button", { name: "Nhắn tin" })).toBeInTheDocument();
    },
  );

  it.each<ApplicationStatus>(["APPLIED", "SCREENING", "REJECTED", "WITHDRAWN"])(
    "is not offered when the application is %s",
    (status) => {
      render(<ApplicationActions application={makeApplication(status)} />);
      expect(screen.queryByRole("button", { name: "Nhắn tin" })).not.toBeInTheDocument();
    },
  );

  it("sits alongside the pipeline actions while the application is still in progress", () => {
    render(<ApplicationActions application={makeApplication("SHORTLISTED")} />);
    expect(screen.getByRole("button", { name: "Nhắn tin" })).toBeInTheDocument();
    // Next step in the pipeline and reject are still there.
    expect(screen.getByRole("button", { name: "Phỏng vấn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Từ chối" })).toBeInTheDocument();
  });

  it("starts the conversation for this application when clicked", async () => {
    (startConversationAndRedirect as jest.Mock).mockResolvedValue(undefined);
    render(<ApplicationActions application={makeApplication("INTERVIEW")} />);

    fireEvent.click(screen.getByRole("button", { name: "Nhắn tin" }));

    await waitFor(() => expect(startConversationAndRedirect).toHaveBeenCalledWith("app-1"));
  });

  it("renders nothing for a rejected application", () => {
    const { container } = render(<ApplicationActions application={makeApplication("REJECTED")} />);
    expect(container).toBeEmptyDOMElement();
  });
});
