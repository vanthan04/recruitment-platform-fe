"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApiToast } from "@/hooks/use-api-toast";
import { PATH } from "@/lib/constants/path";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/constants/enum-label";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/services/notification.service";
import type { Notification } from "@/lib/types/notification";
import { formatRelativeDate } from "@/lib/utils";
import { notificationHref } from "@/lib/utils/notification-link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const { callApi, run, isLoading } = useApiToast();
  const router = useRouter();

  async function handleOpenChange(open: boolean) {
    if (!open || notifications !== null) return;
    const result = await callApi(getMyNotifications({ limit: 5 }));
    if (result) setNotifications(result.items);
  }

  function handleItemClick(notification: Notification) {
    if (!notification.readAt) {
      run(() => markNotificationAsRead(notification.id), {
        onSuccess: () => {
          // router.refresh() alone updates the server-rendered unread badge
          // count but not this locally-cached `notifications` array, so the
          // item kept showing as unread on next open in the same session.
          setNotifications(
            (prev) =>
              prev?.map((item) =>
                item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
              ) ?? prev,
          );
          router.refresh();
        },
      });
    }
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Thông báo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {isLoading && <div className="text-muted-foreground p-2 text-sm">Đang tải...</div>}
        {!isLoading && notifications?.length === 0 && (
          <div className="text-muted-foreground p-2 text-sm">Chưa có thông báo nào.</div>
        )}
        {notifications?.map((notification) => (
          <DropdownMenuItem key={notification.id} asChild>
            <Link
              href={notificationHref(notification)}
              onClick={() => handleItemClick(notification)}
              className="flex flex-col items-start gap-0.5 whitespace-normal"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-medium">{NOTIFICATION_TYPE_LABEL[notification.type]}</span>
                {!notification.readAt && <span className="bg-primary size-1.5 shrink-0 rounded-full" />}
              </span>
              <span className="text-muted-foreground text-xs">{notification.message}</span>
              <span className="text-muted-foreground text-[11px]">
                {formatRelativeDate(notification.createdAt)}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            run(() => markAllNotificationsAsRead(), {
              onSuccess: () => {
                const now = new Date().toISOString();
                setNotifications(
                  (prev) => prev?.map((item) => ({ ...item, readAt: item.readAt ?? now })) ?? prev,
                );
                router.refresh();
              },
            })
          }
        >
          Đánh dấu tất cả đã đọc
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={PATH.NOTIFICATIONS}>Xem tất cả</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
