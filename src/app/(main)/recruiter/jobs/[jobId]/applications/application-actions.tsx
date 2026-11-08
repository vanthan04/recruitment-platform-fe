"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { startConversationAndRedirect } from "@/lib/services/chat.service";
import { updateApplicationStatus } from "@/lib/services/job-application.service";
import {
  CHAT_ELIGIBLE_APPLICATION_STATUSES,
  NON_TERMINAL_APPLICATION_STATUSES,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/types/job-application";
import { nextApplicationStatus } from "@/lib/utils/application-pipeline";

export function ApplicationActions({ application }: { application: JobApplication }) {
  const { run, isPending } = useApiToast();
  const router = useRouter();

  function moveTo(status: ApplicationStatus, successMessage: string) {
    run(() => updateApplicationStatus(application.id, status), {
      successMessage,
      onSuccess: () => router.refresh(),
    });
  }

  // Opens (or resumes) the conversation for this application — the backend
  // only allows it from SHORTLISTED through HIRED, so the button follows suit.
  const messageButton = CHAT_ELIGIBLE_APPLICATION_STATUSES.includes(application.status) ? (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => run(() => startConversationAndRedirect(application.id))}
    >
      Nhắn tin
    </Button>
  ) : null;

  if (NON_TERMINAL_APPLICATION_STATUSES.includes(application.status)) {
    // REJECTED is offered separately below; this is only the "advance" step.
    const nextStatus = nextApplicationStatus(application.status);
    return (
      <div className="flex shrink-0 flex-wrap gap-2">
        {messageButton}
        {nextStatus && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => moveTo(nextStatus, `Đã chuyển sang "${APPLICATION_STATUS_LABEL[nextStatus]}".`)}
          >
            {APPLICATION_STATUS_LABEL[nextStatus]}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => moveTo("REJECTED", "Đã từ chối ứng viên.")}
        >
          Từ chối
        </Button>
      </div>
    );
  }

  // Terminal statuses: only HIRED keeps a chat button (REJECTED/WITHDRAWN → null).
  return messageButton;
}
