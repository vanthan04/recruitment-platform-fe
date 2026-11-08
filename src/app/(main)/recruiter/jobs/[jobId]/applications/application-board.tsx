"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { updateApplicationStatus } from "@/lib/services/job-application.service";
import type { ApplicationStatus, JobApplication } from "@/lib/types/job-application";
import { formatRelativeDate } from "@/lib/utils";
import {
  PIPELINE_COLUMNS,
  applicationAnchorId,
  canMoveApplication,
  groupApplicationsByStatus,
  isFinalApplicationStatus,
  nextApplicationStatus,
  starredFirst,
} from "@/lib/utils/application-pipeline";
import { StarToggle } from "./star-toggle";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * The hiring pipeline as a board: one column per status, one card per applicant.
 *
 * A card moves by dragging it to a column or with the buttons on it — the
 * buttons are the way on touch screens and keyboards, where HTML5 drag-and-drop
 * doesn't work. Either way only the moves the backend allows are offered (one
 * step forward, or reject), and while dragging the columns that would refuse the
 * card are dimmed so that rule is visible rather than a surprise.
 *
 * Moves are applied immediately and rolled back if the backend refuses. Ending
 * the process (hire / reject) asks first: it can't be undone, and dropping a card
 * on the wrong column is easy.
 *
 * It is a pipeline overview; interviews, history and CV downloads live in the
 * list view, which every card links to.
 */
export function ApplicationBoard({ applications }: { applications: JobApplication[] }) {
  const router = useRouter();
  const { run } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [items, setItems] = useState(applications);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Read inside the effect below without making the effect re-run on every move.
  const pendingCount = useRef(0);
  pendingCount.current = pendingIds.size;

  // The server's copy changed (after router.refresh()) — take it, unless a move
  // is still in flight, whose optimistic state it would otherwise briefly undo.
  // That move's own success triggers another refresh, so nothing is missed.
  useEffect(() => {
    if (pendingCount.current === 0) setItems(applications);
  }, [applications]);

  const groups = groupApplicationsByStatus(items);
  const dragging = items.find((a) => a.id === draggingId);

  function setPending(id: string, isPending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setStatus(id: string, status: ApplicationStatus) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  // Lets a star toggle re-sort its column at once (StarToggle handles the request).
  function setStarred(id: string, isStarred: boolean) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, isStarred } : a)));
  }

  async function move(application: JobApplication, to: ApplicationStatus) {
    if (pendingIds.has(application.id) || !canMoveApplication(application.status, to)) return;

    const name = application.candidate?.fullName ?? "ứng viên này";
    if (isFinalApplicationStatus(to)) {
      const confirmed = await confirm(
        to === "REJECTED"
          ? {
              title: `Từ chối ${name}?`,
              description: "Đây là trạng thái cuối cùng, không thể hoàn tác.",
              confirmLabel: "Từ chối ứng viên",
              destructive: true,
            }
          : {
              title: `Tuyển ${name}?`,
              description: `Chuyển đơn sang "${APPLICATION_STATUS_LABEL[to]}". Đây là trạng thái cuối cùng, không thể hoàn tác.`,
              confirmLabel: "Xác nhận tuyển",
            },
      );
      if (!confirmed) return;
    }

    const from = application.status;
    setStatus(application.id, to);
    setPending(application.id, true);
    run(() => updateApplicationStatus(application.id, to), {
      successMessage: `Đã chuyển sang "${APPLICATION_STATUS_LABEL[to]}".`,
      onSuccess: () => {
        setPending(application.id, false);
        router.refresh();
      },
      onError: () => {
        // The backend refused (or the request failed): put the card back.
        setStatus(application.id, from);
        setPending(application.id, false);
      },
    });
  }

  function handleDragStart(event: DragEvent, application: JobApplication) {
    setDraggingId(application.id);
    // Firefox won't start a drag without data; the id itself is kept in state.
    event.dataTransfer.setData("text/plain", application.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: DragEvent, to: ApplicationStatus) {
    event.preventDefault();
    const application = dragging ?? items.find((a) => a.id === event.dataTransfer.getData("text/plain"));
    setDraggingId(null);
    if (application) void move(application, to);
  }

  return (
    <div>
      <p className="text-muted-foreground mb-3 text-sm">
        Kéo thẻ sang cột kế tiếp, hoặc sang &ldquo;{APPLICATION_STATUS_LABEL.REJECTED}&rdquo;, hoặc dùng các
        nút trên thẻ. Mỗi lần chỉ chuyển được một bước.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_COLUMNS.map((status) => {
          // Starred applicants float to the top of their column.
          const cards = starredFirst(groups[status]);
          // `dragging` is only set mid-drag; outside one, no column is a "target".
          const dropAllowed = dragging ? canMoveApplication(dragging.status, status) : undefined;

          return (
            <section
              key={status}
              aria-label={`Cột ${APPLICATION_STATUS_LABEL[status]}`}
              data-drop-allowed={dropAllowed === undefined ? undefined : String(dropAllowed)}
              // Only a column that would accept the card cancels the default,
              // which is what makes the browser allow the drop (and show the
              // "not allowed" cursor over the others).
              onDragOver={(event) => {
                if (dropAllowed) event.preventDefault();
              }}
              onDrop={(event) => handleDrop(event, status)}
              className={[
                "bg-muted/40 w-64 shrink-0 rounded-xl p-2 transition",
                dropAllowed === true ? "ring-primary/60 ring-2" : "",
                dropAllowed === false ? "opacity-40" : "",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-sm font-medium">{APPLICATION_STATUS_LABEL[status]}</h2>
                <Badge variant="secondary" className="rounded-full">
                  {cards.length}
                </Badge>
              </div>
              <ul className="space-y-2">
                {cards.map((application) => {
                  const isFinal = isFinalApplicationStatus(application.status);
                  const isPending = pendingIds.has(application.id);
                  const next = nextApplicationStatus(application.status);
                  const name = application.candidate?.fullName ?? "Ứng viên";

                  return (
                    <li
                      key={application.id}
                      data-testid={`card-${application.id}`}
                      draggable={!isFinal && !isPending}
                      onDragStart={(event) => handleDragStart(event, application)}
                      onDragEnd={() => setDraggingId(null)}
                      className={[
                        "bg-card border-border rounded-lg border p-3 shadow-sm",
                        !isFinal && !isPending ? "cursor-grab active:cursor-grabbing" : "",
                        isPending ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          {application.candidate?.avatarUrl && (
                            <AvatarImage src={application.candidate.avatarUrl} alt={name} />
                          )}
                          <AvatarFallback>{initials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{name}</p>
                          <p className="text-muted-foreground text-xs">
                            Ứng tuyển {formatRelativeDate(application.createdAt)}
                          </p>
                        </div>
                        <StarToggle
                          applicationId={application.id}
                          starred={application.isStarred ?? false}
                          candidateName={name}
                          onChange={(starred) => setStarred(application.id, starred)}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {next && (
                          <Button
                            size="xs"
                            disabled={isPending}
                            aria-label={`Chuyển ${name} sang ${APPLICATION_STATUS_LABEL[next]}`}
                            onClick={() => void move(application, next)}
                          >
                            {APPLICATION_STATUS_LABEL[next]}
                            <ArrowRight />
                          </Button>
                        )}
                        {!isFinal && (
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={isPending}
                            aria-label={`Từ chối ${name}`}
                            onClick={() => void move(application, "REJECTED")}
                          >
                            Từ chối
                          </Button>
                        )}
                        <Link
                          href={`${PATH.RECRUITER_JOB_APPLICATIONS(application.jobId)}?view=list#${applicationAnchorId(application.id)}`}
                          className="text-muted-foreground hover:text-foreground ml-auto text-xs underline underline-offset-2"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </li>
                  );
                })}
                {cards.length === 0 && (
                  <li className="text-muted-foreground px-1 py-3 text-center text-xs">Trống</li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
      {ConfirmDialog}
    </div>
  );
}
