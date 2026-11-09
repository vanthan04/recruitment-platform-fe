import { formatDateTimeVN, formatTimeVN } from "@/lib/utils/format";
import type { DetectionSessionSummary } from "@/lib/types/monitoring";

/** Each session of the interview, and whether the candidate turned monitoring on in it. */
export function SessionList({ sessions }: { sessions: DetectionSessionSummary[] }) {
  if (sessions.length === 0) return null;

  return (
    <section aria-labelledby="monitoring-sessions-heading" className="space-y-2">
      <h2 id="monitoring-sessions-heading" className="text-sm font-semibold">
        Các phiên phỏng vấn
      </h2>
      <ul className="space-y-1.5 text-sm">
        {sessions.map((session) => (
          <li key={session.sessionId} className="rounded-lg border px-3 py-2">
            <p>
              {formatDateTimeVN(session.startedAt)} →{" "}
              {session.endedAt ? formatTimeVN(session.endedAt) : "đang diễn ra"}
            </p>
            <p className="text-muted-foreground text-xs">
              {session.monitoringConsentAt
                ? `Giám sát AI được ứng viên bật lúc ${formatTimeVN(session.monitoringConsentAt)} (thông báo ${session.monitoringNoticeVersion}) · ${session.totalEvents} sự kiện`
                : "Không bật giám sát AI trong phiên này"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
