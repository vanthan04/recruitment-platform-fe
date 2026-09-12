"use client";

import { useRouter } from "next/navigation";
import { InterviewInfo } from "@/components/shared/interview-info";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { cancelInterview, completeInterview, markInterviewNoShow } from "@/lib/services/interview.service";
import { NON_TERMINAL_INTERVIEW_STATUSES, type Interview } from "@/lib/types/interview";
import { InterviewDialog } from "./interview-dialog";

export function InterviewPanel({
  applicationId,
  interview,
}: {
  applicationId: string;
  interview?: Interview;
}) {
  const { run, isPending } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const router = useRouter();

  if (!interview) {
    return <InterviewDialog applicationId={applicationId} />;
  }

  return (
    <div className="mt-2">
      <InterviewInfo interview={interview} />
      <div className="flex flex-wrap gap-2 pt-2">
        <InterviewDialog applicationId={applicationId} interview={interview} />
        {NON_TERMINAL_INTERVIEW_STATUSES.includes(interview.status) && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() => completeInterview(interview.id), {
                  successMessage: "Đã đánh dấu hoàn thành phỏng vấn.",
                  onSuccess: () => router.refresh(),
                })
              }
            >
              Hoàn thành
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() => markInterviewNoShow(interview.id), {
                  successMessage: "Đã đánh dấu ứng viên không đến.",
                  onSuccess: () => router.refresh(),
                })
              }
            >
              Không đến
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={async () => {
                if (await confirm({ title: "Huỷ lịch phỏng vấn này?", destructive: true })) {
                  run(() => cancelInterview(interview.id), {
                    successMessage: "Đã huỷ lịch phỏng vấn.",
                    onSuccess: () => router.refresh(),
                  });
                }
              }}
            >
              Huỷ
            </Button>
          </>
        )}
      </div>
      {ConfirmDialog}
    </div>
  );
}
