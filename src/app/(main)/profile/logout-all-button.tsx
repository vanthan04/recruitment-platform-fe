"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { logoutAll } from "@/lib/services/auth.service";

export function LogoutAllButton() {
  const { run, isPending } = useApiToast();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (confirm("Đăng xuất khỏi tất cả thiết bị đang đăng nhập?")) {
          run(() => logoutAll());
        }
      }}
    >
      {isPending ? "Đang đăng xuất..." : "Đăng xuất tất cả thiết bị"}
    </Button>
  );
}
