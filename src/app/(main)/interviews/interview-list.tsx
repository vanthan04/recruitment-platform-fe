import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { INTERVIEW_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { InterviewDetail } from "@/lib/types/interview";

export function InterviewList({ items }: { items: InterviewDetail[] }) {
  return (
    <ul className="space-y-3">
      {items.map((interview) => (
        <li key={interview.id}>
          <Link
            href={PATH.INTERVIEW_DETAIL(interview.id)}
            className="hover:bg-muted/40 block rounded-xl border p-4 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{interview.jobTitle}</p>
              <Badge variant="outline">{INTERVIEW_STATUS_LABEL[interview.status]}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {new Date(interview.scheduledAt).toLocaleString("vi-VN")}
              {interview.durationMinutes ? ` · ${interview.durationMinutes} phút` : ""}
            </p>
            {interview.viewerRole === "RECRUITER" && (
              <p className="text-muted-foreground mt-0.5 text-sm">
                Ứng viên: {interview.candidateName ?? "Chưa cập nhật tên"}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
