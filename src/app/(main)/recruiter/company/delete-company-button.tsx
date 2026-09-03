"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { deleteCompany } from "@/lib/services/company.service";

export function DeleteCompanyButton({ companyId }: { companyId: string }) {
  const { run, isPending } = useApiToast();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (
          confirm(
            "Xoá công ty này? Các tin tuyển dụng đã đăng sẽ không còn hiển thị thông tin công ty. Hành động này không thể hoàn tác.",
          )
        ) {
          run(() => deleteCompany(companyId), {
            successMessage: "Đã xoá công ty.",
            onSuccess: () => router.refresh(),
          });
        }
      }}
    >
      {isPending ? "Đang xoá..." : "Xoá công ty"}
    </Button>
  );
}
