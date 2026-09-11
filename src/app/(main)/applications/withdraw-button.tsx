"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { withdrawApplication } from "@/lib/services/job-application.service";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const { run, isPending } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={async () => {
          if (await confirm({ title: "Rút đơn ứng tuyển này?" })) {
            run(() => withdrawApplication(applicationId), { successMessage: "Đã rút đơn ứng tuyển." });
          }
        }}
      >
        Rút đơn
      </Button>
      {ConfirmDialog}
    </>
  );
}
