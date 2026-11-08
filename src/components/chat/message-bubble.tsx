"use client";

import { useState, type KeyboardEvent } from "react";
import { FileIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatMessageTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { OptimisticMessage } from "@/lib/types/chat";

const MAX_CONTENT_LENGTH = 5000;
// `updatedAt` is set by the DB on insert too, so it can differ from
// `createdAt` by a few ms on a never-edited message — only treat a real gap
// as "edited".
const EDITED_THRESHOLD_MS = 2000;

export function MessageBubble({
  message,
  isOwn,
  isSeen,
  onRetry,
  onEdit,
  onDelete,
}: {
  message: OptimisticMessage;
  isOwn: boolean;
  /** The other participant has read up to (at least) this message — shows "Đã xem". */
  isSeen?: boolean;
  onRetry?: () => void;
  /** Resolves once saved; rejects on failure (the bubble shows the error). */
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [saving, setSaving] = useState(false);

  const isFailed = message.sendStatus === "failed";
  const isSending = message.sendStatus === "sending";
  const isPersisted = !isSending && !isFailed && !message.id.startsWith("pending-");
  const canModify = isOwn && isPersisted && !message.isDeleted && message.messageType !== "SYSTEM";
  const canEdit = canModify && message.messageType === "TEXT" && !!onEdit;
  const canDelete = canModify && !!onDelete;
  const isEdited =
    !message.isDeleted &&
    new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > EDITED_THRESHOLD_MS;

  function startEditing() {
    setDraft(message.content);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setDraft(message.content);
  }

  async function saveEdit() {
    const next = draft.trim();
    if (!onEdit || saving) return;
    // Nothing to save — just leave edit mode. An emptied message must be
    // deleted explicitly, not blanked out via an edit.
    if (!next || next === message.content) {
      cancelEditing();
      return;
    }
    setSaving(true);
    try {
      await onEdit(next);
      setIsEditing(false);
    } catch {
      toast.error("Không thể sửa tin nhắn");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void saveEdit();
    } else if (event.key === "Escape") {
      cancelEditing();
    }
  }

  // A system line (e.g. the application changed status) is a note about the
  // conversation, not something either person said: centred, no bubble, no
  // own/other side, and never editable, deletable, "seen" or retryable.
  if (message.messageType === "SYSTEM") {
    return (
      <div className="flex flex-col items-center gap-0.5 py-1" role="note">
        <p className="bg-muted text-muted-foreground max-w-[85%] rounded-full px-3 py-1 text-center text-xs break-words">
          {message.content}
        </p>
        <span className="text-muted-foreground text-[0.7rem]">{formatMessageTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className={cn("group flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      {isEditing ? (
        <div className="flex w-full max-w-[75%] flex-col gap-1.5">
          <Textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CONTENT_LENGTH}
            disabled={saving}
            aria-label="Sửa tin nhắn"
            className="min-h-10"
          />
          <div className="flex justify-end gap-1.5">
            <Button type="button" variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
              Huỷ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void saveEdit()}
              disabled={saving || !draft.trim()}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      ) : (
        <div className={cn("flex items-center gap-1", isOwn ? "flex-row-reverse" : "flex-row")}>
          <div
            className={cn(
              "max-w-[75%] rounded-2xl px-3 py-2 text-sm break-words",
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              message.isDeleted && "italic opacity-60",
              isFailed && "border-destructive border",
            )}
          >
            {message.content}
            {message.attachments.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {message.attachments.map((attachment) =>
                  // `fileUrl` is empty until the server resolves the upload key
                  // into a signed URL (see chat-context.tsx sendMessage) — while
                  // still sending, there's nothing to link to yet.
                  attachment.fileUrl ? (
                    <li key={attachment.id}>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs underline underline-offset-2 opacity-90 hover:opacity-100"
                      >
                        <FileIcon className="size-3.5 shrink-0" />
                        <span className="truncate">{attachment.fileName}</span>
                      </a>
                    </li>
                  ) : (
                    <li key={attachment.id} className="flex items-center gap-1.5 text-xs opacity-70">
                      <FileIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{attachment.fileName}</span>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
          {(canEdit || canDelete) && (
            // Revealed on hover/keyboard focus; always laid out so the bubble
            // doesn't shift. Touch devices have no hover, so keep it visible
            // there via the `[@media(hover:none)]` variant.
            <div className="flex opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              {canEdit && (
                <Button variant="ghost" size="icon-xs" onClick={startEditing} aria-label="Sửa tin nhắn">
                  <PencilIcon className="size-3" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon-xs" onClick={onDelete} aria-label="Xoá tin nhắn">
                  <Trash2Icon className="size-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="text-muted-foreground flex items-center gap-1.5 px-1 text-[0.7rem]">
        {isSending && <span>Đang gửi...</span>}
        {isFailed && (
          <>
            <span className="text-destructive">Gửi thất bại</span>
            {onRetry && (
              <Button variant="ghost" size="icon-xs" onClick={onRetry} aria-label="Gửi lại">
                <RotateCcwIcon className="size-3" />
              </Button>
            )}
          </>
        )}
        {!isSending && !isFailed && (
          <span>
            {formatMessageTime(message.createdAt)}
            {isEdited && " · đã chỉnh sửa"}
            {isOwn && isSeen && " · Đã xem"}
          </span>
        )}
      </div>
    </div>
  );
}
