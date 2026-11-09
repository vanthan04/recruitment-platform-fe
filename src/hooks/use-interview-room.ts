"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRoomClient, type RoomClient, type RoomStatus } from "@/lib/rtc/room-client";
import {
  endInterviewSession,
  getInterviewSessions,
  getRoomJoinInfo,
  startInterviewSession,
} from "@/lib/services/interview.service";
import type { InterviewDetail } from "@/lib/types/interview";

export type RoomPhase =
  RoomStatus | "idle" | "starting" | "media-denied" | "no-device" | "media-error" | "error";

const isOpen = (s: { status: string }) => s.status === "IN_PROGRESS";

// Another participant may already have started the session, and a double
// click can race — so "start failed" is only an error if there is still no open one.
async function ensureOpenSession(interviewId: string): Promise<void> {
  const sessions = await getInterviewSessions(interviewId);
  if (sessions.some(isOpen)) return;
  try {
    await startInterviewSession(interviewId);
  } catch (error) {
    const again = await getInterviewSessions(interviewId);
    if (!again.some(isOpen)) throw error;
  }
}

function mediaFailurePhase(error: unknown): RoomPhase {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "media-denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "no-device";
  return "media-error";
}

/**
 * Everything the interview room page needs: camera/mic lifecycle, joining the
 * room through whichever RoomClient the backend's provider selects, and the
 * resulting status. Leaving (or any terminal status) releases the camera.
 */
export function useInterviewRoom(interview: InterviewDetail) {
  const [phase, setPhase] = useState<RoomPhase>("idle");
  const [detail, setDetail] = useState<string | undefined>();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const clientRef = useRef<RoomClient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopLocalMedia = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLocalStream(null);
  }, []);

  const releaseClient = useCallback(() => {
    clientRef.current?.leave();
    clientRef.current = null;
    setRemoteStream(null);
  }, []);

  const enter = useCallback(async () => {
    setDetail(undefined);
    setPhase("starting");

    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Browsers expose mediaDevices only in secure contexts (https / localhost).
        throw new Error("Trình duyệt không hỗ trợ camera, hoặc trang không chạy trên HTTPS.");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (error) {
      setPhase(mediaFailurePhase(error));
      return;
    }
    streamRef.current = stream;
    setLocalStream(stream);
    setMicOn(true);
    setCamOn(true);

    try {
      await ensureOpenSession(interview.id);
      const { join } = await getRoomJoinInfo(interview.id);
      const client = createRoomClient(
        join,
        { interviewId: interview.id, role: interview.viewerRole },
        {
          onStatus: (status, message) => {
            setPhase(status);
            setDetail(message);
            // The call is over (or taken over elsewhere): give the camera back.
            if (status === "closed" || status === "replaced" || status === "failed") {
              stopLocalMedia();
            }
          },
          onRemoteStream: setRemoteStream,
        },
      );
      clientRef.current = client;
      await client.join(stream);
    } catch (error) {
      console.error("Joining the interview room failed", error);
      releaseClient();
      stopLocalMedia();
      setPhase("error");
      setDetail("Không vào được phòng. Hãy kiểm tra buổi phỏng vấn còn hiệu lực rồi thử lại.");
    }
  }, [interview.id, interview.viewerRole, releaseClient, stopLocalMedia]);

  /** Leave the call but keep the session open, so either side can come back. */
  const leave = useCallback(() => {
    releaseClient();
    stopLocalMedia();
    setPhase("idle");
    setDetail(undefined);
  }, [releaseClient, stopLocalMedia]);

  /** End the session for both sides — the backend then closes the room. */
  const endSession = useCallback(async () => {
    try {
      const open = (await getInterviewSessions(interview.id)).find(isOpen);
      if (open) await endInterviewSession(interview.id, open.id);
    } catch (error) {
      console.error("Ending the interview session failed", error);
      setDetail("Không kết thúc được phiên. Hãy thử lại.");
      return;
    }
    // room:closed normally arrives first; this covers a dropped socket.
    releaseClient();
    stopLocalMedia();
    setPhase("closed");
  }, [interview.id, releaseClient, stopLocalMedia]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((track) => (track.enabled = next));
    setMicOn(next);
  }, [micOn]);

  const toggleCamera = useCallback(() => {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach((track) => (track.enabled = next));
    setCamOn(next);
  }, [camOn]);

  // Navigating away must never leave the camera light on.
  useEffect(
    () => () => {
      clientRef.current?.leave();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  return {
    phase,
    detail,
    localStream,
    remoteStream,
    micOn,
    camOn,
    enter,
    leave,
    endSession,
    toggleMic,
    toggleCamera,
  };
}
