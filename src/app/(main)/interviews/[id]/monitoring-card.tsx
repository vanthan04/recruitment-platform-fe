import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants/path";
import type { InterviewDetail } from "@/lib/types/interview";
import type { DetectionSummary } from "@/lib/types/monitoring";

/**
 * Entry point to the monitoring report from the interview page. `summary` is
 * null when it could not be loaded — the rest of the page still works.
 */
export function MonitoringCard({
  interview,
  summary,
}: {
  interview: InterviewDetail;
  summary: DetectionSummary | null;
}) {
  if (!interview.useRoom) return null;
  const isRecruiter = interview.viewerRole === "RECRUITER";
  const everMonitored = summary?.sessions.some((s) => s.monitoringConsentAt) ?? false;

  let text: string;
  if (!summary) text = "Không tải được dữ liệu giám sát AI.";
  else if (!everMonitored)
    text = isRecruiter ? "Ứng viên chưa bật giám sát AI." : "Bạn chưa bật giám sát AI.";
  else if (summary.totalEvents === 0) text = "AI không ghi nhận sự kiện nào.";
  else
    text = `AI ghi nhận ${summary.totalEvents} sự kiện${isRecruiter ? ` (${summary.unreviewedEvents} chưa xem)` : ""}.`;

  return (
    <section aria-labelledby="monitoring-card-heading" className="mt-6 space-y-2 rounded-xl border p-4">
      <h2 id="monitoring-card-heading" className="text-lg font-semibold">
        Giám sát AI
      </h2>
      <p className="text-muted-foreground text-sm">{text}</p>
      {summary && everMonitored && (
        <Button asChild size="sm" variant="outline">
          <Link href={PATH.INTERVIEW_MONITORING(interview.id)}>Xem báo cáo giám sát</Link>
        </Button>
      )}
    </section>
  );
}
