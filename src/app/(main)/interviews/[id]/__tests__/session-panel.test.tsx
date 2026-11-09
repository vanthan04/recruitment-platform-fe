import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SessionPanel } from "../session-panel";
import { endInterviewSession, startInterviewSession } from "@/lib/services/interview.service";
import type { InterviewDetail, InterviewSession, InterviewStatus } from "@/lib/types/interview";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));

jest.mock("@/lib/services/interview.service", () => ({
  startInterviewSession: jest.fn(),
  endInterviewSession: jest.fn(),
}));

jest.mock("@/lib/services/auth.service", () => ({
  logout: jest.fn(),
}));

function makeInterview(status: InterviewStatus = "SCHEDULED"): InterviewDetail {
  return {
    id: "interview-1",
    jobApplicationId: "app-1",
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
    durationMinutes: 45,
    location: "Office",
    meetingLink: null,
    useRoom: false,
    note: null,
    status,
    createdById: "recruiter-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    jobId: "job-1",
    jobTitle: "Backend Developer",
    candidateId: "candidate-1",
    candidateName: "Cand Idate",
    viewerRole: "CANDIDATE",
  };
}

function makeSession(overrides: Partial<InterviewSession> = {}): InterviewSession {
  return {
    id: "session-1",
    interviewId: "interview-1",
    startedAt: new Date().toISOString(),
    endedAt: null,
    startedById: "candidate-1",
    status: "IN_PROGRESS",
    ...overrides,
  };
}

describe("SessionPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each<InterviewStatus>(["SCHEDULED", "RESCHEDULED"])(
    "offers to start a session for a %s interview with none open, and refreshes after starting",
    async (status) => {
      (startInterviewSession as jest.Mock).mockResolvedValue(makeSession());
      render(<SessionPanel interview={makeInterview(status)} sessions={[]} />);

      fireEvent.click(screen.getByRole("button", { name: "Bắt đầu phiên" }));

      await waitFor(() => expect(startInterviewSession).toHaveBeenCalledWith("interview-1"));
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    },
  );

  it("shows the open session and lets the user end it — and offers no second start", async () => {
    (endInterviewSession as jest.Mock).mockResolvedValue(makeSession({ status: "ENDED" }));
    render(<SessionPanel interview={makeInterview()} sessions={[makeSession()]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Phiên đang diễn ra");
    expect(screen.queryByRole("button", { name: "Bắt đầu phiên" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Kết thúc phiên" }));

    await waitFor(() => expect(endInterviewSession).toHaveBeenCalledWith("interview-1", "session-1"));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it.each<InterviewStatus>(["COMPLETED", "CANCELLED", "NO_SHOW"])(
    "offers no new session once the interview is %s",
    (status) => {
      render(<SessionPanel interview={makeInterview(status)} sessions={[]} />);

      expect(screen.queryByRole("button", { name: "Bắt đầu phiên" })).not.toBeInTheDocument();
      expect(screen.getByText("Buổi phỏng vấn này không còn nhận phiên mới.")).toBeInTheDocument();
    },
  );

  it("lists ended sessions separately from the open one", () => {
    render(
      <SessionPanel
        interview={makeInterview("COMPLETED")}
        sessions={[makeSession({ status: "ENDED", endedAt: new Date().toISOString() })]}
      />,
    );

    expect(screen.getByText("Các phiên đã kết thúc")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
