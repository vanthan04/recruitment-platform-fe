import { Badge } from "@/components/ui/badge";
import { MONITORING_END_REASON_LABEL, MONITORING_EVENT_LABEL } from "@/lib/constants/enum-label";
import { formatDateTimeVN, formatDurationVi, formatTimeVN } from "@/lib/utils/format";
import type { DetectionEvent } from "@/lib/types/monitoring";
import { ReviewEventDialog } from "./review-event-dialog";

/**
 * Oldest first. Each entry keeps what the AI observed (type, time, its own
 * confidence) visibly separate from what a person concluded (review + note).
 */
export function EventTimeline({
  events,
  interviewId,
  canReview,
}: {
  events: DetectionEvent[];
  interviewId: string;
  canReview: boolean;
}) {
  return (
    <ol className="space-y-2" aria-label="Dòng thời gian sự kiện">
      {events.map((event) => {
        const endReason = event.metadata?.endReason;
        const personCount = event.metadata?.personCount;
        return (
          <li key={event.id} className="space-y-2 rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{MONITORING_EVENT_LABEL[event.eventType]}</p>
                <p className="text-muted-foreground text-sm">
                  {formatDateTimeVN(event.detectedAt)} →{" "}
                  {event.endedAt ? formatTimeVN(event.endedAt) : "chưa kết thúc"}
                  {event.durationMs !== null && ` · ${formatDurationVi(event.durationMs)}`}
                </p>
              </div>
              <Badge variant={event.reviewedAt ? "secondary" : "outline"}>
                {event.reviewedAt ? "Đã xem" : "Chưa xem"}
              </Badge>
            </div>

            <p className="text-muted-foreground text-xs">
              AI ghi nhận · độ tin cậy cao nhất {Math.round(event.confidence * 100)}% · {event.frameCount}{" "}
              khung hình
              {event.eventType === "MULTIPLE_PERSONS" && personCount ? ` · tối đa ${personCount} người` : ""}
              {endReason && MONITORING_END_REASON_LABEL[endReason]
                ? ` · kết thúc vì ${MONITORING_END_REASON_LABEL[endReason]}`
                : ""}
            </p>

            {canReview && (
              <div className="flex flex-wrap items-start justify-between gap-2 border-t pt-2">
                <p className="text-sm">
                  {event.reviewedAt ? (
                    <>
                      <span className="font-medium">Đánh giá của bạn</span>{" "}
                      <span className="text-muted-foreground">({formatDateTimeVN(event.reviewedAt)})</span>
                      {event.reviewNote ? `: ${event.reviewNote}` : " — không có ghi chú"}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Chưa có đánh giá của nhà tuyển dụng.</span>
                  )}
                </p>
                <ReviewEventDialog interviewId={interviewId} event={event} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
