"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureJpeg } from "@/lib/monitoring/frame-capture";
import { MonitorClient } from "@/lib/monitoring/monitor-client";
import { MONITORING_NOTICE_VERSION, type FrameDetectionResult } from "@/lib/types/monitoring";

export type MonitoringStatus =
  | "off"
  | "starting"
  | "on"
  /** Running, but the AI service is not answering right now — frames are being dropped. */
  | "degraded"
  /** Connection to the backend lost; resumes by itself. */
  | "reconnecting"
  /** The session ended, so monitoring stopped. */
  | "ended"
  | "error";

export interface MonitoringResult extends FrameDetectionResult {
  receivedAt: number;
}

export interface MonitoringStats {
  sent: number;
  analysed: number;
  dropped: number;
}

/** Default and minimum: one frame per second (see recruitment-platform-ai/docs/benchmark.md). */
export const DEFAULT_FRAME_INTERVAL_MS = 1000;

const START_ERROR_MESSAGE: Record<string, string> = {
  AI_UNAVAILABLE: "Giám sát AI hiện chưa sẵn sàng. Buổi phỏng vấn vẫn diễn ra bình thường.",
  INTERVIEW_MONITORING_NOT_ALLOWED: "Chỉ ứng viên mới bật được giám sát AI cho camera của mình.",
  INTERVIEW_SESSION_NOT_OPEN: "Phiên phỏng vấn chưa bắt đầu hoặc đã kết thúc.",
  INTERVIEW_ROOM_NOT_ENABLED: "Buổi phỏng vấn này không diễn ra trong phòng của nền tảng.",
  NOTICE_OUTDATED: "Thông báo giám sát đã được cập nhật. Hãy tải lại trang để đọc bản mới.",
  CONNECTION_FAILED: "Không kết nối được tới máy chủ giám sát.",
  TIMEOUT: "Máy chủ giám sát không phản hồi.",
};

/**
 * Candidate-side AI monitoring: samples the candidate's own camera stream (the
 * same one the call uses — the camera is not opened again), sends one JPEG at a
 * time and keeps the latest detections for display.
 *
 * - Never more than one frame in flight; ticks that find one pending are skipped.
 * - Nothing is analysed while the camera is turned off.
 * - Any failure only drops frames; it never touches the call.
 * - Passing `stream: null` (left the room) or unmounting stops everything.
 */
export function useAiMonitoring({
  interviewId,
  stream,
  intervalMs = DEFAULT_FRAME_INTERVAL_MS,
}: {
  interviewId: string;
  stream: MediaStream | null;
  intervalMs?: number;
}) {
  const [status, setStatus] = useState<MonitoringStatus>("off");
  const [message, setMessage] = useState<string | undefined>();
  const [result, setResult] = useState<MonitoringResult | null>(null);
  const [stats, setStats] = useState<MonitoringStats>({ sent: 0, analysed: 0, dropped: 0 });
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const clientRef = useRef<MonitorClient | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(stream);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const stopLoop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    inFlightRef.current = false;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    videoRef.current = null;
    canvasRef.current = null;
  }, []);

  const tick = useCallback(async () => {
    const client = clientRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const track = streamRef.current?.getVideoTracks()[0];
    if (!client || !video || !canvas || inFlightRef.current) return;
    // Camera turned off by the candidate: nothing to analyse, nothing is sent.
    if (!track || !track.enabled || track.readyState !== "live") return;

    inFlightRef.current = true;
    try {
      const jpeg = await captureJpeg(video, canvas);
      if (!jpeg) return;
      const startedAt = performance.now();
      setStats((s) => ({ ...s, sent: s.sent + 1 }));
      const ack = await client.sendFrame(jpeg);
      if (clientRef.current !== client) return; // stopped meanwhile
      if (ack.ok) {
        setResult({ ...ack.data, receivedAt: Date.now() });
        setLatencyMs(Math.round(performance.now() - startedAt));
        setStats((s) => ({ ...s, analysed: s.analysed + 1 }));
        setStatus((current) => (current === "degraded" ? "on" : current));
      } else {
        setStats((s) => ({ ...s, dropped: s.dropped + 1 }));
        if (ack.code === "AI_UNAVAILABLE" || ack.code === "TIMEOUT") setStatus("degraded");
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    stopLoop();
    clientRef.current?.stop();
    clientRef.current = null;
    setResult(null);
    setStatus("off");
    setMessage(undefined);
  }, [stopLoop]);

  const start = useCallback(async () => {
    const currentStream = streamRef.current;
    if (!currentStream || clientRef.current) return;
    setStatus("starting");
    setMessage(undefined);
    setStats({ sent: 0, analysed: 0, dropped: 0 });
    setLatencyMs(null);

    const client = new MonitorClient(interviewId, MONITORING_NOTICE_VERSION, {
      onStopped: () => {
        stopLoop();
        clientRef.current = null;
        setResult(null);
        setStatus("ended");
      },
      onConnectionChange: (connected) => {
        if (clientRef.current === client) setStatus(connected ? "on" : "reconnecting");
      },
    });
    clientRef.current = client;

    const ack = await client.start();
    if (clientRef.current !== client) return; // stopped while starting
    if (!ack.ok) {
      clientRef.current = null;
      setStatus("error");
      setMessage(START_ERROR_MESSAGE[ack.code] ?? "Không bật được giám sát AI. Hãy thử lại.");
      return;
    }

    // A private, muted element on the same stream — the visible preview is untouched.
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = currentStream;
    void video.play()?.catch(() => {});
    videoRef.current = video;
    canvasRef.current = document.createElement("canvas");

    setStatus("on");
    timerRef.current = setInterval(() => void tick(), Math.max(intervalMs, ack.minFrameIntervalMs));
  }, [interviewId, intervalMs, stopLoop, tick]);

  // Left the room (no stream any more): stop monitoring with it.
  useEffect(() => {
    if (!stream && clientRef.current) stop();
  }, [stream, stop]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clientRef.current?.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
    },
    [],
  );

  return { status, message, result, stats, latencyMs, start, stop };
}

export type AiMonitoring = ReturnType<typeof useAiMonitoring>;
