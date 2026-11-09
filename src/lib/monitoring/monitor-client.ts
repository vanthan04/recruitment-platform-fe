import { createMonitorSocket } from "@/lib/realtime/monitor-socket";
import type { MonitorFrameAck, MonitorStartAck } from "@/lib/types/monitoring";

/** The slice of a socket.io client used here — lets tests pass a fake. */
export interface MonitorSocket {
  on(event: string, handler: (...args: never[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
  timeout(ms: number): { emitWithAck(event: string, ...args: unknown[]): Promise<unknown> };
  connect(): unknown;
  disconnect(): unknown;
}

export interface MonitorClientEvents {
  /** The backend stopped monitoring (the session ended). */
  onStopped(reason: string): void;
  /** Lost the connection; frames are paused until it is back and re-started. */
  onConnectionChange(connected: boolean): void;
}

const START_TIMEOUT_MS = 10_000;
const FRAME_TIMEOUT_MS = 8_000;

/**
 * One monitoring run for one interview. `start` records the candidate's
 * consent on the backend and must succeed before any frame is accepted.
 * After a reconnect the backend has forgotten the socket, so the client
 * re-sends start (the backend keeps the original consent).
 */
export class MonitorClient {
  private socket: MonitorSocket | null = null;
  private connected = false;
  private started = false;
  private stopped = false;

  constructor(
    private readonly interviewId: string,
    private readonly noticeVersion: string,
    private readonly events: MonitorClientEvents,
    private readonly createSocket: () => MonitorSocket = createMonitorSocket,
  ) {}

  async start(): Promise<MonitorStartAck> {
    const socket = this.createSocket();
    this.socket = socket;

    const connected = new Promise<boolean>((resolve) => {
      socket.on("connect", () => {
        const reconnect = this.started;
        this.connected = true;
        this.events.onConnectionChange(true);
        if (reconnect) void this.sendStart();
        resolve(true);
      });
      socket.on("connect_error", () => resolve(false));
    });
    socket.on("disconnect", () => {
      this.connected = false;
      if (!this.stopped) this.events.onConnectionChange(false);
    });
    socket.on("monitor:stopped", (payload: { reason?: string }) => {
      this.teardown();
      this.events.onStopped(payload?.reason ?? "stopped");
    });

    socket.connect();
    if (!(await connected)) {
      this.teardown();
      return { ok: false, code: "CONNECTION_FAILED", message: "Không kết nối được tới máy chủ giám sát." };
    }

    const ack = await this.sendStart();
    if (ack.ok) this.started = true;
    else this.teardown();
    return ack;
  }

  /** Sends one JPEG; resolves with the detections or why this frame was dropped. */
  async sendFrame(jpeg: Blob): Promise<MonitorFrameAck> {
    if (!this.socket || !this.started || !this.connected) return { ok: false, code: "NOT_STARTED" };
    const bytes = await jpeg.arrayBuffer();
    try {
      return (await this.socket
        .timeout(FRAME_TIMEOUT_MS)
        .emitWithAck("monitor:frame", bytes)) as MonitorFrameAck;
    } catch {
      return { ok: false, code: "TIMEOUT" };
    }
  }

  stop(): void {
    if (this.stopped) return;
    this.socket?.emit("monitor:stop");
    this.teardown();
  }

  private async sendStart(): Promise<MonitorStartAck> {
    try {
      return (await this.socket!.timeout(START_TIMEOUT_MS).emitWithAck("monitor:start", {
        interviewId: this.interviewId,
        noticeVersion: this.noticeVersion,
      })) as MonitorStartAck;
    } catch {
      return { ok: false, code: "TIMEOUT", message: "Máy chủ giám sát không phản hồi." };
    }
  }

  private teardown(): void {
    this.stopped = true;
    this.started = false;
    this.socket?.disconnect();
    this.socket = null;
  }
}
