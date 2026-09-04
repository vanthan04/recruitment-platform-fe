"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { startConversationAndRedirect } from "@/lib/services/chat.service";
import { updateApplicationStatus } from "@/lib/services/job-application.service";
import {
  NON_TERMINAL_APPLICATION_STATUSES,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/types/job-application";

// Mirrors the backend's forward transition map (application-status.vo.ts) —
// REJECTED is always offered separately, this only lists the "advance" step.
const NEXT_STATUS: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  APPLIED: "SCREENING",
  SCREENING: "SHORTLISTED",
  SHORTLISTED: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: "HIRED",
};

export function ApplicationActions({ application }: { application: JobApplication }) {
  const { run, isPending } = useApiToast();
  const router = useRouter();

  function moveTo(status: ApplicationStatus, successMessage: string) {
    run(() => updateApplicationStatus(application.id, status), {
      successMessage,
      onSuccess: () => router.refresh(),
    });
  }

  if (NON_TERMINAL_APPLICATION_STATUSES.includes(application.status)) {
    const nextStatus = NEXT_STATUS[application.status];
    return (
      <div className="flex shrink-0 flex-wrap gap-2">
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

  if (application.status === "HIRED") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run(() => startConversationAndRedirect(application.id))}
      >
        Nhắn tin
      </Button>
    );
  }

  return null;
}
