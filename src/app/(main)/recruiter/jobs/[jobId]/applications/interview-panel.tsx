"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { INTERVIEW_STATUS_LABEL } from "@/lib/constants/enum-label";
import { cancelInterview } from "@/lib/services/interview.service";
import type { Interview } from "@/lib/types/interview";
import { InterviewDialog } from "./interview-dialog";

export function InterviewPanel({
  applicationId,
  interview,
}: {
  applicationId: string;
  interview?: Interview;
}) {
  const { run, isPending } = useApiToast();
  const router = useRouter();

  if (!interview) {
    return <InterviewDialog applicationId={applicationId} />;
  }

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
      <div className="flex gap-2 pt-1">
        <InterviewDialog applicationId={applicationId} interview={interview} />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (confirm("Huỷ lịch phỏng vấn này?")) {
              run(() => cancelInterview(interview.id), {
                successMessage: "Đã huỷ lịch phỏng vấn.",
                onSuccess: () => router.refresh(),
              });
            }
          }}
        >
          Huỷ
        </Button>
      </div>
    </div>
  );
}
