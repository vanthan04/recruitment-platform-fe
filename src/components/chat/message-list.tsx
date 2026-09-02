"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import type { OptimisticMessage } from "@/lib/types/chat";

const NEAR_BOTTOM_THRESHOLD_PX = 120;

export function MessageList({
  messages,
  currentUserId,
  otherParticipantName,
  isOtherTyping,
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
}: {
  messages: OptimisticMessage[];
  currentUserId: string;
  otherParticipantName: string;
  isOtherTyping: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRetry: (message: OptimisticMessage) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const previousCount = useRef(messages.length);

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
          Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
        </p>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.clientMessageId}
          message={message}
          isOwn={message.senderId === currentUserId}
          onRetry={message.sendStatus === "failed" ? () => onRetry(message) : undefined}
        />
      ))}

      {isOtherTyping && <TypingIndicator label={otherParticipantName} />}
    </div>
  );
}
