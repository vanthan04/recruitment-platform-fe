"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { NOTIFICATION_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { ListMeta } from "@/lib/types/common";
import type { Notification, NotificationListParams } from "@/lib/types/notification";

export async function getMyNotifications(
  params: NotificationListParams = {},
): Promise<{ items: Notification[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<Notification[]>(NOTIFICATION_ENDPOINT.LIST, {
    searchParams: params,
  });
  return { items, meta: metadata };
}

// No dedicated unread-count endpoint on the backend — fetch a reasonably
// sized page and count locally. Fail-soft: called from the shared layout,
// must never crash unrelated pages.
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { items } = await getMyNotifications({ limit: 50 });
    return items.filter((notification) => !notification.isRead).length;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(NOTIFICATION_ENDPOINT.MARK_READ(id));
  revalidatePath(PATH.NOTIFICATIONS);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch(NOTIFICATION_ENDPOINT.MARK_ALL_READ);
  revalidatePath(PATH.NOTIFICATIONS);
}
