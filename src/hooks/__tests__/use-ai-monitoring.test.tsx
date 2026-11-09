import { act, renderHook } from "@testing-library/react";
import { useAiMonitoring } from "../use-ai-monitoring";
import { MonitorClient } from "@/lib/monitoring/monitor-client";
import { captureJpeg } from "@/lib/monitoring/frame-capture";

jest.mock("@/lib/monitoring/monitor-client", () => ({ MonitorClient: jest.fn() }));
jest.mock("@/lib/monitoring/frame-capture", () => ({ captureJpeg: jest.fn() }));

const result = {
  imageWidth: 640,
  imageHeight: 360,
  inferenceMs: 40,
  detections: [
    { classId: 0, className: "person", confidence: 0.9, boundingBox: { x: 1, y: 2, width: 3, height: 4 } },
  ],
};

function makeStream(enabled = true) {
  const track = { enabled, readyState: "live" };
  return { stream: { getVideoTracks: () => [track] } as unknown as MediaStream, track };
}

describe("useAiMonitoring", () => {
  let client: { start: jest.Mock; sendFrame: jest.Mock; stop: jest.Mock };
  let events: { onStopped(reason: string): void; onConnectionChange(c: boolean): void };

  beforeEach(() => {
    jest.useFakeTimers();
    client = {
      start: jest.fn().mockResolvedValue({
        ok: true,
        sessionId: "s1",
        consentedAt: "x",
        maxFrameBytes: 1,
        minFrameIntervalMs: 500,
      }),
      sendFrame: jest.fn().mockResolvedValue({ ok: true, data: result }),
      stop: jest.fn(),
    };
    (MonitorClient as unknown as jest.Mock).mockImplementation((_id, _version, e) => {
      events = e;
      return client;
    });
    (captureJpeg as jest.Mock).mockResolvedValue(new Blob(["x"]));
    jest.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function started(stream = makeStream().stream) {
    const hook = renderHook(({ s }) => useAiMonitoring({ interviewId: "interview-1", stream: s }), {
      initialProps: { s: stream as MediaStream | null },
    });
    await act(async () => {
      await hook.result.current.start();
    });
    return hook;
  }

  const advance = async (ms: number) => {
    await act(async () => {
      jest.advanceTimersByTime(ms);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  it("starts with the current notice version and sends one frame per second", async () => {
    const hook = await started();

    expect(MonitorClient).toHaveBeenCalledWith("interview-1", "2026-11-09.v2", expect.any(Object));
    expect(hook.result.current.status).toBe("on");

    await advance(1000);
    expect(client.sendFrame).toHaveBeenCalledTimes(1);
    expect(hook.result.current.result?.detections).toHaveLength(1);
    expect(hook.result.current.stats).toMatchObject({ sent: 1, analysed: 1, dropped: 0 });

    await advance(1000);
    expect(client.sendFrame).toHaveBeenCalledTimes(2);
  });

  it("never has more than one frame in flight", async () => {
    let release!: () => void;
    client.sendFrame.mockReturnValueOnce(new Promise((r) => (release = () => r({ ok: true, data: result }))));
    await started();

    await advance(1000);
    await advance(1000);
    await advance(1000);
    expect(client.sendFrame).toHaveBeenCalledTimes(1);

    await act(async () => release());
    await advance(1000);
    expect(client.sendFrame).toHaveBeenCalledTimes(2);
  });

  it("sends nothing while the camera is turned off", async () => {
    const { stream, track } = makeStream(true);
    await started(stream);
    track.enabled = false;

    await advance(3000);
    expect(client.sendFrame).not.toHaveBeenCalled();
  });

  it("counts drops and shows degraded while the AI service is unavailable, then recovers", async () => {
    client.sendFrame.mockResolvedValueOnce({ ok: false, code: "AI_UNAVAILABLE" });
    const hook = await started();

    await advance(1000);
    expect(hook.result.current.status).toBe("degraded");
    expect(hook.result.current.stats.dropped).toBe(1);

    await advance(1000);
    expect(hook.result.current.status).toBe("on");
  });

  it("reports a refused start with a readable message and sends nothing", async () => {
    client.start.mockResolvedValue({ ok: false, code: "AI_UNAVAILABLE", message: "x" });
    const hook = await started();

    expect(hook.result.current.status).toBe("error");
    expect(hook.result.current.message).toMatch(/chưa sẵn sàng/);
    await advance(3000);
    expect(client.sendFrame).not.toHaveBeenCalled();
  });

  it("stops when the session ends", async () => {
    const hook = await started();

    act(() => events.onStopped("session-ended"));
    expect(hook.result.current.status).toBe("ended");
    await advance(3000);
    expect(client.sendFrame).not.toHaveBeenCalled();
  });

  it("stop() ends the run and clears results", async () => {
    const hook = await started();
    await advance(1000);

    act(() => hook.result.current.stop());

    expect(client.stop).toHaveBeenCalled();
    expect(hook.result.current.status).toBe("off");
    expect(hook.result.current.result).toBeNull();
    await advance(3000);
    expect(client.sendFrame).toHaveBeenCalledTimes(1);
  });

  it("stops by itself when the stream goes away (left the room)", async () => {
    const hook = await started();

    hook.rerender({ s: null });

    expect(client.stop).toHaveBeenCalled();
    expect(hook.result.current.status).toBe("off");
  });

  it("stops on unmount", async () => {
    const hook = await started();
    hook.unmount();
    expect(client.stop).toHaveBeenCalled();
  });
});
