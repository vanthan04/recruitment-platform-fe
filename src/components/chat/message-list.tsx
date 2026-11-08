"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { OptimisticMessage } from "@/lib/types/chat";

const NEAR_BOTTOM_THRESHOLD_PX = 120;

/**
 * The id of the latest message *you* sent that the other participant has
 * seen — the one message that should carry the "Đã xem" label (like
 * Messenger: the marker sits at the last seen message, not on every one).
 * Messages still sending/failed or already deleted never count as seen.
 */
export function findLastSeenOwnMessageId(
  messages: OptimisticMessage[],
  currentUserId: string,
  otherReadAt: string | null | undefined,
): string | null {
  if (!otherReadAt) return null;
  const readTime = new Date(otherReadAt).getTime();

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.senderId !== currentUserId) continue;
    // A system line is stored under the recruiter's id but isn't something
    // they said — it can't be the message the other side "saw".
    if (message.messageType === "SYSTEM") continue;
    if (message.isDeleted || message.sendStatus === "sending" || message.sendStatus === "failed") continue;
    if (new Date(message.createdAt).getTime() <= readTime) return message.id;
  }
  return null;
}

export function MessageList({
  messages,
  currentUserId,
  otherParticipantName,
  otherReadAt,
  isOtherTyping,
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
  onEdit,
  onDelete,
  readOnly = false,
}: {
  messages: OptimisticMessage[];
  currentUserId: string;
  otherParticipantName: string;
  /** When the other participant last read the conversation (ISO), if ever. */
  otherReadAt?: string | null;
  isOtherTyping: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRetry: (message: OptimisticMessage) => void;
  /** Omit to hide editing (e.g. a read-only conversation). */
  onEdit?: (message: OptimisticMessage, content: string) => Promise<void>;
  onDelete: (message: OptimisticMessage) => void;
  /** The conversation can no longer be written to — no edit, no retry of failed sends, no "start chatting" prompt. */
  readOnly?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const previousCount = useRef(messages.length);
  const seenMessageId = findLastSeenOwnMessageId(messages, currentUserId, otherReadAt);

  useEffect(() => {
    const grew = messages.length > previousCount.current;
    previousCount.current = messages.length;
    if (grew && isNearBottom && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, isNearBottom]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    setIsNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX);
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Đang tải..." : "Tải tin nhắn cũ hơn"}
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {readOnly ? "Chưa có tin nhắn nào." : "Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!"}
        </p>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.clientMessageId}
          message={message}
          isOwn={message.senderId === currentUserId}
          isSeen={message.id === seenMessageId}
          onRetry={message.sendStatus === "failed" && !readOnly ? () => onRetry(message) : undefined}
          onEdit={onEdit && !readOnly ? (content) => onEdit(message, content) : undefined}
          onDelete={() => onDelete(message)}
        />
      ))}

      {isOtherTyping && <TypingIndicator label={otherParticipantName} />}
    </div>
  );
}
