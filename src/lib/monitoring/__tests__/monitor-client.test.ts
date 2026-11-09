import { MonitorClient, type MonitorSocket } from "../monitor-client";

class FakeSocket implements MonitorSocket {
  handlers = new Map<string, (...args: unknown[]) => void>();
  emit = jest.fn();
  disconnect = jest.fn();
  emitWithAck = jest.fn();
  timeouts: number[] = [];
  connectBehaviour: "connect" | "error" = "connect";
  on(event: string, handler: (...args: never[]) => void) {
    this.handlers.set(event, handler as (...args: unknown[]) => void);
  }
  connect = jest.fn(() => {
    queueMicrotask(() =>
      this.fire(this.connectBehaviour === "connect" ? "connect" : "connect_error", new Error("x")),
    );
  });
  timeout(ms: number) {
    this.timeouts.push(ms);
    return { emitWithAck: this.emitWithAck };
  }
  fire(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.(...args);
  }
}

const okStart = {
  ok: true,
  sessionId: "s1",
  consentedAt: "x",
  maxFrameBytes: 524288,
  minFrameIntervalMs: 500,
};

function setup() {
  const socket = new FakeSocket();
  const events = { onStopped: jest.fn(), onConnectionChange: jest.fn() };
  const client = new MonitorClient("interview-1", "v1", events, () => socket);
  return { socket, events, client };
}

// jsdom's Blob has no arrayBuffer(); browsers do — give the fixture one.
const jpeg = () =>
  ({ arrayBuffer: () => Promise.resolve(new Uint8Array([0xff, 0xd8, 0xff, 1]).buffer) }) as unknown as Blob;

describe("MonitorClient", () => {
  it("connects, sends start with the interview and notice version, and returns the ack", async () => {
    const { socket, client } = setup();
    socket.emitWithAck.mockResolvedValue(okStart);

    await expect(client.start()).resolves.toEqual(okStart);
    expect(socket.emitWithAck).toHaveBeenCalledWith("monitor:start", {
      interviewId: "interview-1",
      noticeVersion: "v1",
    });
  });

  it("gives up and disconnects when the backend refuses to start", async () => {
    const { socket, client } = setup();
    socket.emitWithAck.mockResolvedValue({ ok: false, code: "AI_UNAVAILABLE", message: "x" });

    await expect(client.start()).resolves.toMatchObject({ ok: false, code: "AI_UNAVAILABLE" });
    expect(socket.disconnect).toHaveBeenCalled();
    await expect(client.sendFrame(jpeg())).resolves.toEqual({ ok: false, code: "NOT_STARTED" });
  });

  it("reports a connection failure", async () => {
    const { socket, client } = setup();
    socket.connectBehaviour = "error";

    await expect(client.start()).resolves.toMatchObject({ ok: false, code: "CONNECTION_FAILED" });
    expect(socket.emitWithAck).not.toHaveBeenCalled();
  });

  it("sends a frame as binary and returns the detections", async () => {
    const { socket, client } = setup();
    socket.emitWithAck.mockResolvedValueOnce(okStart);
    await client.start();
    const ack = { ok: true, data: { imageWidth: 640, imageHeight: 360, inferenceMs: 40, detections: [] } };
    socket.emitWithAck.mockResolvedValueOnce(ack);

    await expect(client.sendFrame(jpeg())).resolves.toEqual(ack);
    const [event, payload] = socket.emitWithAck.mock.calls[1];
    expect(event).toBe("monitor:frame");
    expect(payload).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(payload as ArrayBuffer)[0]).toBe(0xff);
  });

  it("turns a missing ack into a TIMEOUT drop", async () => {
    const { socket, client } = setup();
    socket.emitWithAck.mockResolvedValueOnce(okStart);
    await client.start();
    socket.emitWithAck.mockRejectedValueOnce(new Error("operation has timed out"));

    await expect(client.sendFrame(jpeg())).resolves.toEqual({ ok: false, code: "TIMEOUT" });
  });

  it("pauses while disconnected and re-sends start after reconnecting", async () => {
    const { socket, client, events } = setup();
    socket.emitWithAck.mockResolvedValue(okStart);
    await client.start();

    socket.fire("disconnect");
    expect(events.onConnectionChange).toHaveBeenLastCalledWith(false);
    await expect(client.sendFrame(jpeg())).resolves.toEqual({ ok: false, code: "NOT_STARTED" });

    socket.fire("connect");
    expect(events.onConnectionChange).toHaveBeenLastCalledWith(true);
    expect(socket.emitWithAck.mock.calls.filter(([e]) => e === "monitor:start")).toHaveLength(2);
  });

  it("stops when the backend says the session ended", async () => {
    const { socket, client, events } = setup();
    socket.emitWithAck.mockResolvedValue(okStart);
    await client.start();

    socket.fire("monitor:stopped", { reason: "session-ended" });

    expect(events.onStopped).toHaveBeenCalledWith("session-ended");
    expect(socket.disconnect).toHaveBeenCalled();
  });

  it("stop() tells the backend once and disconnects", async () => {
    const { socket, client } = setup();
    socket.emitWithAck.mockResolvedValue(okStart);
    await client.start();

    client.stop();
    client.stop();

    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith("monitor:stop");
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });
});
