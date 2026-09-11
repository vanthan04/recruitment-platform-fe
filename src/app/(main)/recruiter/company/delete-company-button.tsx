"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteCompany } from "@/lib/services/company.service";

export function DeleteCompanyButton({ companyId }: { companyId: string }) {
  const { run, isPending } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const router = useRouter();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={isPending}
        onClick={async () => {
          const confirmed = await confirm({
            title: "Xoá công ty này?",
            description:
              "Các tin tuyển dụng đã đăng sẽ không còn hiển thị thông tin công ty. Hành động này không thể hoàn tác.",
            destructive: true,
          });
          if (confirmed) {
            run(() => deleteCompany(companyId), {
              successMessage: "Đã xoá công ty.",
              onSuccess: () => router.refresh(),
            });
          }
        }}
      >
        {isPending ? "Đang xoá..." : "Xoá công ty"}
      </Button>
      {ConfirmDialog}
    </>
  );
}
