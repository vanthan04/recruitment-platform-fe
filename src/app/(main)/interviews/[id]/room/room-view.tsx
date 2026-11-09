"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { AiMonitoringPanel } from "@/components/monitoring/ai-monitoring-panel";
import { DetectionOverlay } from "@/components/monitoring/detection-overlay";
import { Button } from "@/components/ui/button";
import { useAiMonitoring, type MonitoringStatus } from "@/hooks/use-ai-monitoring";
import { useConfirm } from "@/hooks/use-confirm";
import { useInterviewRoom, type RoomPhase } from "@/hooks/use-interview-room";
import { PATH } from "@/lib/constants/path";
import type { InterviewDetail } from "@/lib/types/interview";

const PHASE_MESSAGE: Record<RoomPhase, string> = {
  idle: "Bạn chưa vào phòng. Khi bấm “Vào phòng”, trình duyệt sẽ xin quyền dùng camera và micro.",
  starting: "Đang chuẩn bị camera và micro…",
  connecting: "Đang kết nối…",
  waiting: "Đang chờ người còn lại vào phòng…",
  connected: "Đã kết nối.",
  reconnecting: "Kết nối bị gián đoạn, đang thử lại…",
  closed: "Phiên phỏng vấn đã kết thúc.",
  replaced: "Bạn đã vào phòng từ một tab hoặc thiết bị khác.",
  failed: "Không vào được phòng.",
  error: "Không vào được phòng.",
  "media-denied":
    "Trình duyệt đang chặn camera hoặc micro. Hãy cho phép quyền truy cập trong thanh địa chỉ rồi thử lại.",
  "no-device": "Không tìm thấy camera hoặc micro trên thiết bị này.",
  "media-error": "Không mở được camera hoặc micro. Có thể ứng dụng khác đang dùng chúng.",
};

/** Phases in which the visitor is not (or no longer) in the room and may try to enter. */
const CAN_ENTER: RoomPhase[] = [
  "idle",
  "failed",
  "error",
  "replaced",
  "media-denied",
  "no-device",
  "media-error",
];
const IN_ROOM: RoomPhase[] = ["connecting", "waiting", "connected", "reconnecting"];
const MONITORING_ACTIVE: MonitoringStatus[] = ["on", "degraded", "reconnecting"];

function VideoSurface({
  stream,
  muted,
  mirrored,
  className,
  label,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      aria-label={label}
      className={`${className ?? ""} ${mirrored ? "-scale-x-100" : ""} bg-black object-cover`}
    />
  );
}

export function RoomView({ interview }: { interview: InterviewDetail }) {
  const {
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
  } = useInterviewRoom(interview);
  const { confirm, ConfirmDialog } = useConfirm();

  const inRoom = IN_ROOM.includes(phase);
  const isCandidate = interview.viewerRole === "CANDIDATE";
  // Only the candidate's own camera, only while in the room; leaving stops it.
  const monitoring = useAiMonitoring({
    interviewId: interview.id,
    stream: isCandidate && inRoom ? localStream : null,
  });
  const monitoringActive = MONITORING_ACTIVE.includes(monitoring.status);
  const message = (phase === "failed" || phase === "error") && detail ? detail : PHASE_MESSAGE[phase];
  const otherParty =
    interview.viewerRole === "RECRUITER" ? (interview.candidateName ?? "Ứng viên") : "Nhà tuyển dụng";

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        {remoteStream ? (
          <VideoSurface stream={remoteStream} label={otherParty} className="size-full" />
        ) : (
          <div className="flex size-full items-center justify-center p-6 text-center text-sm text-white/80">
            {inRoom ? `Chưa có hình ảnh từ ${otherParty}` : "Phòng phỏng vấn"}
          </div>
        )}
        {localStream && (
          // Self-view. Larger while AI monitoring is on, so the boxes are readable.
          <div
            className={`absolute right-3 bottom-3 aspect-video overflow-hidden rounded-lg border border-white/30 ${
              monitoringActive ? "w-40 sm:w-72" : "w-28 sm:w-44"
            }`}
          >
            <VideoSurface stream={localStream} muted mirrored label="Bạn" className="size-full" />
            {monitoringActive && <DetectionOverlay result={monitoring.result} mirrored />}
          </div>
        )}
      </div>

      <p role="status" aria-live="polite" className="text-muted-foreground text-sm">
        {message}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {CAN_ENTER.includes(phase) && (
          <Button type="button" onClick={() => void enter()}>
            Vào phòng
          </Button>
        )}
        {phase === "starting" && (
          <Button type="button" disabled>
            Đang chuẩn bị…
          </Button>
        )}
        {inRoom && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleMic}
              aria-pressed={!micOn}
              aria-label={micOn ? "Tắt micro" : "Bật micro"}
            >
              {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleCamera}
              aria-pressed={!camOn}
              aria-label={camOn ? "Tắt camera" : "Bật camera"}
            >
              {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
            </Button>
            <Button type="button" variant="outline" onClick={leave}>
              <PhoneOff className="size-4" aria-hidden="true" />
              Rời phòng
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={async () => {
                if (
                  await confirm({
                    title: "Kết thúc phiên phỏng vấn?",
                    description: "Cả hai bên sẽ bị ngắt khỏi phòng.",
                    destructive: true,
                  })
                ) {
                  await endSession();
                }
              }}
            >
              Kết thúc phiên
            </Button>
          </>
        )}
        {(phase === "closed" || phase === "idle") && (
          <Button asChild variant="ghost">
            <Link href={PATH.INTERVIEW_DETAIL(interview.id)}>Về trang buổi phỏng vấn</Link>
          </Button>
        )}
      </div>
      {isCandidate && inRoom && <AiMonitoringPanel monitoring={monitoring} />}
      {ConfirmDialog}
    </div>
  );
}
