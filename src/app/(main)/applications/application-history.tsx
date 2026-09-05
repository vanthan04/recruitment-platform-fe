import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import type { ApplicationStatusHistoryEntry } from "@/lib/types/job-application";
import { formatMessageTime } from "@/lib/utils";

interface ApplicationHistoryProps {
  history: ApplicationStatusHistoryEntry[];
}

// Native <details>/<summary> — no client component needed for a plain
// expand/collapse, and history is usually short (a handful of transitions).
export function ApplicationHistory({ history }: ApplicationHistoryProps) {
  if (history.length === 0) return null;

  return (
    <details className="mt-3 text-sm">
      <summary className="text-muted-foreground w-fit cursor-pointer select-none hover:underline">
        Xem lịch sử ({history.length})
      </summary>
      <ol className="border-muted mt-2 space-y-2 border-l pl-4">
        {history.map((entry) => (
          <li key={entry.id}>
            <p>
              {entry.fromStatus ? (
                <>
                  {APPLICATION_STATUS_LABEL[entry.fromStatus]} <span aria-hidden>→</span>{" "}
                </>
              ) : null}
              <span className="font-medium">{APPLICATION_STATUS_LABEL[entry.toStatus]}</span>
            </p>
            {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
            <p className="text-muted-foreground text-xs">{formatMessageTime(entry.createdAt)}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
