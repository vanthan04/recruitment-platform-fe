/** Same contract as the backend's MonitoringGateway acks (see recruitment-platform-be). */

export interface BoundingBox {
  /** Top-left corner, whole pixels of the frame that was sent. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameDetection {
  classId: number;
  className: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface FrameDetectionResult {
  imageWidth: number;
  imageHeight: number;
  inferenceMs: number;
  detections: FrameDetection[];
}

export type MonitorStartAck =
  | { ok: true; sessionId: string; consentedAt: string; maxFrameBytes: number; minFrameIntervalMs: number }
  | { ok: false; code: string; message: string };

export type MonitorFrameErrorCode =
  | "NOT_STARTED"
  | "INVALID_FRAME"
  | "FRAME_TOO_LARGE"
  | "RATE_LIMITED"
  | "BUSY"
  | "AI_BUSY"
  | "AI_UNAVAILABLE"
  | "AI_REJECTED"
  /** Client-side: no ack in time. */
  | "TIMEOUT";

export type MonitorFrameAck =
  { ok: true; data: FrameDetectionResult } | { ok: false; code: MonitorFrameErrorCode };

/**
 * Version of the monitoring notice the candidate agrees to. Recorded with the
 * consent on the backend — bump it whenever the notice text or what happens to
 * the data changes (e.g. when Phase 4 starts storing detection events).
 */
export const MONITORING_NOTICE_VERSION = "2026-11-09.v1";
