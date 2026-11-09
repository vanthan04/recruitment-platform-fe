import { fireEvent, render, screen, within } from "@testing-library/react";
import { AiMonitoringPanel } from "../ai-monitoring-panel";
import { DetectionOverlay } from "../detection-overlay";
import { summarizeDetections } from "../detection-labels";
import type { AiMonitoring } from "@/hooks/use-ai-monitoring";

const person = {
  classId: 0,
  className: "person",
  confidence: 0.91,
  boundingBox: { x: 0, y: 0, width: 320, height: 180 },
};
const phone = {
  classId: 67,
  className: "cell phone",
  confidence: 0.8,
  boundingBox: { x: 320, y: 180, width: 64, height: 36 },
};

function monitoring(overrides: Partial<AiMonitoring> = {}): AiMonitoring {
  return {
    status: "off",
    message: undefined,
    result: null,
    stats: { sent: 0, analysed: 0, dropped: 0 },
    latencyMs: null,
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    ...overrides,
  };
}

describe("AiMonitoringPanel", () => {
  it("only starts after the candidate reads the notice and ticks the box", () => {
    const m = monitoring();
    render(<AiMonitoringPanel monitoring={m} />);

    fireEvent.click(screen.getByRole("button", { name: "Bật giám sát AI" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/không được lưu lại/)).toBeInTheDocument();
    expect(within(dialog).getByText(/2026-11-09\.v1/)).toBeInTheDocument();

    const confirm = within(dialog).getByRole("button", { name: "Đồng ý và bật" });
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(m.start).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(confirm);
    expect(m.start).toHaveBeenCalledTimes(1);
  });

  it("declining does nothing", () => {
    const m = monitoring();
    render(<AiMonitoringPanel monitoring={m} />);

    fireEvent.click(screen.getByRole("button", { name: "Bật giám sát AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Không bật" }));

    expect(m.start).not.toHaveBeenCalled();
  });

  it("asks again for consent each time (the box starts unticked)", () => {
    render(<AiMonitoringPanel monitoring={monitoring()} />);
    fireEvent.click(screen.getByRole("button", { name: "Bật giám sát AI" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Không bật" }));

    fireEvent.click(screen.getByRole("button", { name: "Bật giám sát AI" }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("shows what the AI sees while on, and can be turned off", () => {
    const m = monitoring({
      status: "on",
      latencyMs: 120,
      result: {
        imageWidth: 640,
        imageHeight: 360,
        inferenceMs: 40,
        detections: [person, phone],
        receivedAt: 0,
      },
    });
    render(<AiMonitoringPanel monitoring={m} />);

    expect(screen.getByText(/AI đang thấy: 1 người, 1 điện thoại/)).toBeInTheDocument();
    expect(screen.getByText(/có thể sai/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tắt giám sát AI" }));
    expect(m.stop).toHaveBeenCalled();
  });

  it.each([
    ["degraded", /tạm thời không phản hồi/],
    ["reconnecting", /đang thử lại/],
  ] as const)("explains the %s state", (status, text) => {
    render(<AiMonitoringPanel monitoring={monitoring({ status })} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("shows why it could not start", () => {
    render(
      <AiMonitoringPanel
        monitoring={monitoring({ status: "error", message: "Giám sát AI hiện chưa sẵn sàng." })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("chưa sẵn sàng");
    expect(screen.getByRole("button", { name: "Bật giám sát AI" })).toBeInTheDocument();
  });
});

describe("summarizeDetections", () => {
  it("counts per class in Vietnamese", () => {
    expect(summarizeDetections([person, phone, person])).toBe("2 người, 1 điện thoại");
  });
});

describe("DetectionOverlay", () => {
  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(180);
  });
  afterEach(() => jest.restoreAllMocks());

  it("places mirrored boxes over a cover-fitted self-view, with readable labels", () => {
    render(
      <div>
        <DetectionOverlay
          result={{ imageWidth: 640, imageHeight: 360, inferenceMs: 1, detections: [person, phone] }}
          mirrored
        />
      </div>,
    );

    const boxes = screen.getAllByTestId("detection-box");
    expect(boxes).toHaveLength(2);
    // person: left half of the frame -> right half of the mirrored view.
    expect(boxes[0]).toHaveStyle({ left: "160px", top: "0px", width: "160px", height: "90px" });
    expect(boxes[0]).toHaveTextContent("người 91%");
  });

  it("renders nothing without a result", () => {
    render(<DetectionOverlay result={null} mirrored />);
    expect(screen.queryByTestId("detection-box")).not.toBeInTheDocument();
  });
});
