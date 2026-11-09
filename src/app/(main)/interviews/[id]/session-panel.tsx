"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { PATH } from "@/lib/constants/path";
import { endInterviewSession, startInterviewSession } from "@/lib/services/interview.service";
import {
  NON_TERMINAL_INTERVIEW_STATUSES,
  type InterviewDetail,
  type InterviewSession,
} from "@/lib/types/interview";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

export function SessionPanel({
  interview,
  sessions,
}: {
  interview: InterviewDetail;
  sessions: InterviewSession[];
}) {
  const { run, isPending } = useApiToast();
  const router = useRouter();

  const openSession = sessions.find((session) => session.status === "IN_PROGRESS");
  const endedSessions = sessions.filter((session) => session.status === "ENDED");
  const canStart = NON_TERMINAL_INTERVIEW_STATUSES.includes(interview.status) && !openSession;

  return (
    <section className="mt-6 space-y-4" aria-labelledby="interview-sessions-heading">
      <h2 id="interview-sessions-heading" className="text-lg font-semibold">
        Phiên phỏng vấn
      </h2>

      {interview.useRoom && NON_TERMINAL_INTERVIEW_STATUSES.includes(interview.status) && (
        <div className="space-y-2 rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">
            Buổi phỏng vấn này diễn ra trong phòng video của nền tảng. Vào phòng sẽ tự bắt đầu phiên nếu chưa
            có.
          </p>
          <Button asChild>
            <Link href={PATH.INTERVIEW_ROOM(interview.id)}>Vào phòng video</Link>
          </Button>
        </div>
      )}

      {openSession ? (
        <div className="space-y-3 rounded-xl border p-4" role="status">
          <p className="text-sm">
            Phiên đang diễn ra, bắt đầu lúc{" "}
            <span className="font-medium">{formatTime(openSession.startedAt)}</span>.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => endInterviewSession(interview.id, openSession.id), {
                successMessage: "Đã kết thúc phiên phỏng vấn.",
                onSuccess: () => router.refresh(),
              })
            }
          >
            Kết thúc phiên
          </Button>
        </div>
      ) : canStart ? (
        <div className="space-y-3 rounded-xl border p-4">
          <p className="text-muted-foreground text-sm">
            Bắt đầu phiên khi buổi phỏng vấn diễn ra. Chỉ ứng viên và nhà tuyển dụng của tin này mới thấy
            phiên.
          </p>
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(() => startInterviewSession(interview.id), {
                successMessage: "Đã bắt đầu phiên phỏng vấn.",
                onSuccess: () => router.refresh(),
              })
            }
          >
            Bắt đầu phiên
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Buổi phỏng vấn này không còn nhận phiên mới.</p>
      )}

      {endedSessions.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">Các phiên đã kết thúc</h3>
          <ul className="space-y-1.5 text-sm">
            {endedSessions.map((session) => (
              <li key={session.id} className="rounded-lg border px-3 py-2">
                {formatTime(session.startedAt)} → {session.endedAt ? formatTime(session.endedAt) : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
