"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { markAllNotificationsAsRead } from "@/lib/services/notification.service";

export function MarkAllReadButton() {
  const { run, isPending } = useApiToast();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        run(() => markAllNotificationsAsRead(), { successMessage: "Đã đánh dấu tất cả đã đọc." })
      }
    >
      Đánh dấu tất cả đã đọc
    </Button>
  );
}
