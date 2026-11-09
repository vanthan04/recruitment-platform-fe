import { MONITORING_EVENT_LABEL } from "@/lib/constants/enum-label";
import { MONITORING_EVENT_TYPES, type DetectionSummary } from "@/lib/types/monitoring";

/** Plain counts per observation type — deliberately no score, rating or total "risk". */
export function SummaryCards({
  summary,
  showUnreviewed,
}: {
  summary: DetectionSummary;
  showUnreviewed: boolean;
}) {
  return (
    <section aria-labelledby="monitoring-summary-heading" className="space-y-2">
      <h2 id="monitoring-summary-heading" className="text-sm font-semibold">
        Số sự kiện theo loại
        <span className="text-muted-foreground font-normal">
          {" "}
          · tổng {summary.totalEvents}
          {showUnreviewed && `, ${summary.unreviewedEvents} chưa xem`}
        </span>
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MONITORING_EVENT_TYPES.map((type) => (
          <li key={type} className="rounded-xl border p-3">
            <p className="text-2xl font-semibold tabular-nums">{summary.byType[type]}</p>
            <p className="text-muted-foreground text-xs leading-snug">{MONITORING_EVENT_LABEL[type]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
