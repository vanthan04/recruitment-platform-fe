"use client";

import { useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import {
  addApplicationNote,
  deleteApplicationNote,
  getApplicationNotes,
} from "@/lib/services/job-application.service";
import { APPLICATION_NOTE_MAX_LENGTH, type ApplicationNote } from "@/lib/types/job-application";
import { cn, formatRelativeDate } from "@/lib/utils";

/**
 * The recruiter's internal notes on one applicant — after each interview round,
 * say. Private to the job's recruiter; the candidate never sees them.
 *
 * Collapsed by default and loaded only when opened, so the applicants page
 * doesn't make one more request per applicant just to render.
 */
export function ApplicationNotes({ applicationId }: { applicationId: string }) {
  const { callApi, isLoading } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<ApplicationNote[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");

  async function load() {
    setLoading(true);
    setLoadFailed(false);
    try {
      setNotes(await getApplicationNotes(applicationId));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && notes === null && !loading) void load();
  }

  async function add() {
    const content = draft.trim();
    if (!content) return;
    const created = await callApi(addApplicationNote(applicationId, content), {
      successMessage: "Đã thêm ghi chú.",
    });
    if (created) {
      setNotes((prev) => [created, ...(prev ?? [])]);
      setDraft("");
    }
  }

  async function remove(note: ApplicationNote) {
    const confirmed = await confirm({
      title: "Xoá ghi chú này?",
      description: "Ghi chú sẽ bị xoá vĩnh viễn.",
      confirmLabel: "Xoá",
      destructive: true,
    });
    if (!confirmed) return;
    const deleted = await callApi(
      deleteApplicationNote(applicationId, note.id).then(() => true),
      { successMessage: "Đã xoá ghi chú." },
    );
    if (deleted) setNotes((prev) => prev?.filter((n) => n.id !== note.id) ?? prev);
  }

  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
      >
        <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
        Ghi chú nội bộ{notes ? ` (${notes.length})` : ""}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          <p className="text-muted-foreground text-xs">
            Chỉ bạn thấy — ứng viên không bao giờ thấy ghi chú này.
          </p>

          <div className="space-y-1.5">
            <Textarea
              aria-label="Ghi chú mới"
              placeholder="Ví dụ: Vòng 1 — nền tảng NestJS tốt, cần hỏi thêm về hệ thống phân tán."
              value={draft}
              maxLength={APPLICATION_NOTE_MAX_LENGTH}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-16"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">
                {draft.length}/{APPLICATION_NOTE_MAX_LENGTH}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={!draft.trim() || isLoading}
                onClick={() => void add()}
              >
                Thêm ghi chú
              </Button>
            </div>
          </div>

          {loading && <p className="text-muted-foreground text-sm">Đang tải...</p>}

          {loadFailed && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-destructive">Không tải được ghi chú.</span>
              <Button type="button" size="xs" variant="outline" onClick={() => void load()}>
                Thử lại
              </Button>
            </div>
          )}

          {notes && notes.length === 0 && (
            <p className="text-muted-foreground text-sm">Chưa có ghi chú nào.</p>
          )}

          {notes && notes.length > 0 && (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="bg-muted/40 rounded-lg p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm break-words whitespace-pre-wrap">{note.content}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Xoá ghi chú"
                      disabled={isLoading}
                      onClick={() => void remove(note)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{formatRelativeDate(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}
