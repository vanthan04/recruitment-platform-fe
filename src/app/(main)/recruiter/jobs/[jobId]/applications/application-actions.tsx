"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { startConversationAndRedirect } from "@/lib/services/chat.service";
import { updateApplicationStatus } from "@/lib/services/job-application.service";
import type { JobApplication } from "@/lib/types/job-application";

export function ApplicationActions({ application }: { application: JobApplication }) {
  const { run, isPending } = useApiToast();
  const router = useRouter();

  if (application.status === "PENDING") {
    return (
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            run(() => updateApplicationStatus(application.id, "ACCEPTED"), {
              successMessage: "Đã chấp nhận ứng viên.",
              onSuccess: () => router.refresh(),
            })
          }
        >
          Chấp nhận
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() => updateApplicationStatus(application.id, "REJECTED"), {
              successMessage: "Đã từ chối ứng viên.",
              onSuccess: () => router.refresh(),
            })
          }
        >
          Từ chối
        </Button>
      </div>
    );
  }

  if (application.status === "ACCEPTED") {
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
