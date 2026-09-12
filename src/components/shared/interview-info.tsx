import { Badge } from "@/components/ui/badge";
import { INTERVIEW_STATUS_LABEL } from "@/lib/constants/enum-label";
import type { Interview } from "@/lib/types/interview";

export function InterviewInfo({ interview }: { interview: Interview }) {
  return (
    <div className="bg-muted/30 mt-2 space-y-1.5 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{INTERVIEW_STATUS_LABEL[interview.status]}</Badge>
        <span className="font-medium">{new Date(interview.scheduledAt).toLocaleString("vi-VN")}</span>
      </div>
      {interview.location && <p className="text-muted-foreground">Địa điểm: {interview.location}</p>}
      {interview.meetingLink && (
        <p className="text-muted-foreground">
          Link:{" "}
          <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary underline">
            {interview.meetingLink}
          </a>
        </p>
      )}
      {interview.note && <p className="text-muted-foreground">Ghi chú: {interview.note}</p>}
    </div>
  );
}
