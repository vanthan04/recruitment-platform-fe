"use client";

import { FileIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { OptimisticMessage } from "@/lib/types/chat";

export function MessageBubble({
  message,
  isOwn,
  onRetry,
}: {
  message: OptimisticMessage;
  isOwn: boolean;
  onRetry?: () => void;
}) {
  const isFailed = message.sendStatus === "failed";
  const isSending = message.sendStatus === "sending";

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
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
            {message.attachments.map((attachment) => (
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
            ))}
          </ul>
        )}
      </div>
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
        {!isSending && !isFailed && <span>{formatMessageTime(message.createdAt)}</span>}
      </div>
    </div>
  );
}
