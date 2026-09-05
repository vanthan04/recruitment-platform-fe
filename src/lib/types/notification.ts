export type NotificationType = "NEW_APPLICATION" | "APPLICATION_STATUS_CHANGED" | "NEW_MESSAGE";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
}
