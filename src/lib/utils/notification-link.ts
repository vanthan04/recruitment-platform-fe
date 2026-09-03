import { PATH } from "@/lib/constants/path";
import type { Notification } from "@/lib/types/notification";

// `metadata` shape per notification type (per API_GUIDE.md):
// NEW_APPLICATION -> { applicationId, jobId }, APPLICATION_STATUS_CHANGED ->
// { applicationId, jobId, status }, NEW_MESSAGE -> conversation-related.
export function notificationHref(notification: Notification): string {
  const jobId = typeof notification.metadata?.jobId === "string" ? notification.metadata.jobId : undefined;

  switch (notification.type) {
    case "NEW_APPLICATION":
      return jobId ? PATH.RECRUITER_JOB_APPLICATIONS(jobId) : PATH.NOTIFICATIONS;
    case "APPLICATION_STATUS_CHANGED":
      return PATH.APPLICATIONS;
    case "NEW_MESSAGE":
      return PATH.MESSAGES;
    default:
      return PATH.NOTIFICATIONS;
  }
}
