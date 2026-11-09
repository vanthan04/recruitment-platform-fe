import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EventTimeline } from "../event-timeline";
import { SummaryCards } from "../summary-cards";
import { SessionList } from "../session-list";
import { MonitoringCard } from "../../monitoring-card";
import { reviewDetectionEvent } from "@/lib/services/monitoring.service";
import type { DetectionEvent, DetectionSummary } from "@/lib/types/monitoring";
import type { InterviewDetail } from "@/lib/types/interview";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  unstable_rethrow: (error: unknown) => {
    throw error;
  },
}));
jest.mock("@/lib/services/monitoring.service", () => ({ reviewDetectionEvent: jest.fn() }));
jest.mock("@/lib/services/auth.service", () => ({ logout: jest.fn() }));

function makeEvent(overrides: Partial<DetectionEvent> = {}): DetectionEvent {
  return {
    id: "event-1",
    sessionId: "session-1",
    eventType: "PHONE_DETECTED",
    objectClass: "cell phone",
    confidence: 0.834,
    detectedAt: "2026-11-09T03:00:00.000Z", // 10:00:00 in Vietnam
    endedAt: "2026-11-09T03:00:12.000Z",
    durationMs: 12_000,
    frameCount: 12,
    metadata: { personCount: 1, endReason: "condition-cleared" },
    reviewedAt: null,
    reviewedById: null,
    reviewNote: null,
    ...overrides,
  };
}

const zero = { PERSON_ABSENT: 0, MULTIPLE_PERSONS: 0, PHONE_DETECTED: 0, LAPTOP_DETECTED: 0 };

function makeSummary(overrides: Partial<DetectionSummary> = {}): DetectionSummary {
  return {
    totalEvents: 3,
    unreviewedEvents: 2,
    byType: { ...zero, PHONE_DETECTED: 2, PERSON_ABSENT: 1 },
    sessions: [
      {
        sessionId: "session-1",
        startedAt: "2026-11-09T02:55:00.000Z",
        endedAt: null,
        monitoringConsentAt: "2026-11-09T02:56:00.000Z",
        monitoringNoticeVersion: "2026-11-09.v2",
        totalEvents: 3,
        byType: { ...zero, PHONE_DETECTED: 2, PERSON_ABSENT: 1 },
      },
    ],
    ...overrides,
  };
}

describe("EventTimeline", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows what the AI observed, in Vietnam time, with its confidence", () => {
    render(<EventTimeline events={[makeEvent()]} interviewId="i-1" canReview />);

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Thấy điện thoại");
    expect(item).toHaveTextContent("10:00:00");
    expect(item).toHaveTextContent("10:00:12");
    expect(item).toHaveTextContent("12 giây");
    expect(item).toHaveTextContent("độ tin cậy cao nhất 83%");
    expect(item).toHaveTextContent("kết thúc vì không còn quan sát thấy");
    expect(within(item).getByText("Chưa xem")).toBeInTheDocument();
  });

  it("marks an event that is still open", () => {
    render(
      <EventTimeline
        events={[makeEvent({ endedAt: null, durationMs: null, metadata: null })]}
        interviewId="i-1"
        canReview
      />,
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("chưa kết thúc");
  });

  it("keeps the recruiter's review separate from the AI observation", () => {
    render(
      <EventTimeline
        events={[makeEvent({ reviewedAt: "2026-11-09T04:00:00.000Z", reviewNote: "Đã hỏi lại ứng viên" })]}
        interviewId="i-1"
        canReview
      />,
    );
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Đánh giá của bạn");
    expect(item).toHaveTextContent("Đã hỏi lại ứng viên");
    expect(within(item).getByText("Đã xem")).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: "Sửa ghi chú" })).toBeInTheDocument();
  });

  it("gives the candidate a read-only view: review status, no note, no review button", () => {
    render(
      <EventTimeline
        events={[
          makeEvent({
            reviewedAt: "2026-11-09T04:00:00.000Z",
            reviewNote: undefined,
            reviewedById: undefined,
          }),
        ]}
        interviewId="i-1"
        canReview={false}
      />,
    );
    const item = screen.getByRole("listitem");
    expect(within(item).getByText("Đã xem")).toBeInTheDocument();
    expect(within(item).queryByRole("button")).not.toBeInTheDocument();
    expect(item).not.toHaveTextContent("Đánh giá của bạn");
  });

  it("lets the recruiter mark an event reviewed with a trimmed note", async () => {
    (reviewDetectionEvent as jest.Mock).mockResolvedValue(makeEvent());
    render(<EventTimeline events={[makeEvent()]} interviewId="i-1" canReview />);

    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã xem" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("ứng viên chỉ thấy sự kiện đã được");
    fireEvent.change(within(dialog).getByLabelText("Ghi chú (không bắt buộc)"), {
      target: { value: "  Đồng hồ hẹn giờ  " },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Đánh dấu đã xem" }));

    await waitFor(() =>
      expect(reviewDetectionEvent).toHaveBeenCalledWith("i-1", "event-1", "Đồng hồ hẹn giờ"),
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("sends no note when the field is left empty", async () => {
    (reviewDetectionEvent as jest.Mock).mockResolvedValue(makeEvent());
    render(<EventTimeline events={[makeEvent()]} interviewId="i-1" canReview />);

    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã xem" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Đánh dấu đã xem" }));

    await waitFor(() => expect(reviewDetectionEvent).toHaveBeenCalledWith("i-1", "event-1", null));
  });
});

describe("SummaryCards", () => {
  it("shows plain counts per type — no score", () => {
    render(<SummaryCards summary={makeSummary()} showUnreviewed />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items.map((li) => li.textContent)).toEqual([
      "1Không thấy người trong khung hình",
      "0Có từ 2 người trở lên",
      "2Thấy điện thoại",
      "0Thấy laptop",
    ]);
    expect(screen.getByText(/tổng 3, 2 chưa xem/)).toBeInTheDocument();
    expect(screen.queryByText(/điểm|score|rủi ro/i)).not.toBeInTheDocument();
  });

  it("does not show the review backlog to the candidate", () => {
    render(<SummaryCards summary={makeSummary()} showUnreviewed={false} />);
    expect(screen.queryByText(/chưa xem/)).not.toBeInTheDocument();
  });
});

describe("SessionList", () => {
  it("says, per session, whether the candidate turned monitoring on", () => {
    const summary = makeSummary();
    render(
      <SessionList
        sessions={[
          ...summary.sessions,
          {
            ...summary.sessions[0],
            sessionId: "s0",
            monitoringConsentAt: null,
            monitoringNoticeVersion: null,
            totalEvents: 0,
          },
        ]}
      />,
    );
    const [on, off] = screen.getAllByRole("listitem");
    expect(on).toHaveTextContent(
      "Giám sát AI được ứng viên bật lúc 09:56:00 (thông báo 2026-11-09.v2) · 3 sự kiện",
    );
    expect(off).toHaveTextContent("Không bật giám sát AI trong phiên này");
  });
});

describe("MonitoringCard", () => {
  const interview = { id: "i-1", useRoom: true, viewerRole: "RECRUITER" } as InterviewDetail;

  it("summarises and links to the report for the recruiter", () => {
    render(<MonitoringCard interview={interview} summary={makeSummary()} />);
    expect(screen.getByText("AI ghi nhận 3 sự kiện (2 chưa xem).")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem báo cáo giám sát" })).toHaveAttribute(
      "href",
      "/interviews/i-1/monitoring",
    );
  });

  it("states neutrally that monitoring was not turned on", () => {
    render(
      <MonitoringCard
        interview={interview}
        summary={makeSummary({
          totalEvents: 0,
          sessions: [{ ...makeSummary().sessions[0], monitoringConsentAt: null }],
        })}
      />,
    );
    expect(screen.getByText("Ứng viên chưa bật giám sát AI.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("survives a summary that failed to load", () => {
    render(<MonitoringCard interview={interview} summary={null} />);
    expect(screen.getByText("Không tải được dữ liệu giám sát AI.")).toBeInTheDocument();
  });

  it("renders nothing for an interview not held in the platform room", () => {
    const { container } = render(
      <MonitoringCard interview={{ ...interview, useRoom: false }} summary={makeSummary()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
