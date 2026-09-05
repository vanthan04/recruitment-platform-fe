"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useApiToast } from "@/hooks/use-api-toast";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/constants/enum-label";
import { markNotificationAsRead } from "@/lib/services/notification.service";
import type { Notification } from "@/lib/types/notification";
import { cn, formatRelativeDate } from "@/lib/utils";
import { notificationHref } from "@/lib/utils/notification-link";

export function NotificationList({ items }: { items: Notification[] }) {
  const { run } = useApiToast();
  const router = useRouter();

  if (items.length === 0) {
    return <p className="text-muted-foreground py-10 text-center text-sm">Chưa có thông báo nào.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((notification) => (
        <Link
          key={notification.id}
          href={notificationHref(notification)}
          onClick={() => {
            if (!notification.readAt) {
              run(() => markNotificationAsRead(notification.id), { onSuccess: () => router.refresh() });
            }
          }}
          className={cn(
            "hover:bg-muted/50 flex items-start justify-between gap-3 rounded-lg border p-4 transition-colors",
            !notification.readAt && "border-primary/30 bg-primary/5",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={notification.readAt ? "outline" : "default"}>
                {NOTIFICATION_TYPE_LABEL[notification.type]}
              </Badge>
              {!notification.readAt && <span className="bg-primary size-1.5 shrink-0 rounded-full" />}
            </div>
            <p className="mt-1 font-medium">{notification.title}</p>
            <p className="text-muted-foreground text-sm">{notification.message}</p>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatRelativeDate(notification.createdAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}
