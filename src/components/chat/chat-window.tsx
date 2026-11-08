"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useChat, useChatPresence } from "@/contexts/chat-context";
import { useConfirm } from "@/hooks/use-confirm";
import { ConversationHeader } from "@/components/chat/conversation-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { getMessages } from "@/lib/services/chat.service";
import type { Conversation, Message, MessageAttachmentInput, OptimisticMessage } from "@/lib/types/chat";

// Newest message from the other participant that actually exists on the
// server (an optimistic `pending-*` id can only be our own anyway).
function latestIncomingId(messages: Message[], currentUserId: string): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderId !== currentUserId) return messages[i].id;
  }
  return null;
}

// The later of two ISO timestamps — a live "read" event and the value the
// page was server-rendered with can each be the fresher one.
function laterOf(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

export function ChatWindow({
  conversation,
  currentUserId,
  initialMessages,
  initialNextCursor,
}: {
  conversation: Conversation;
  currentUserId: string;
  initialMessages: Message[];
  initialNextCursor: string | null;
}) {
  const chat = useChat();
  const { confirm, ConfirmDialog } = useConfirm();
  const { onlineUserIds } = useChatPresence();
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  // The newest incoming message already acknowledged to the server, so the
  // auto-mark-read effect below fires once per new message — not on mount
  // (the effect right here already marked everything read on open).
  const lastMarkedIncomingId = useRef<string | null>(null);

  useEffect(() => {
    chat.hydrateMessages(conversation.id, initialMessages, "replace");
    setNextCursor(initialNextCursor);
    chat.subscribeToConversation(conversation.id);
    lastMarkedIncomingId.current = latestIncomingId(initialMessages, currentUserId);
    chat.markRead(conversation.id);

    return () => chat.unsubscribeFromConversation(conversation.id);
    // Re-run only when the open conversation changes — initialMessages/
    // initialNextCursor are the fresh server-fetched values for that id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  const messages = chat.messagesByConversation[conversation.id] ?? [];
  const isOtherTyping =
    chat.typingByConversation[conversation.id]?.has(conversation.otherParticipant.id) ?? false;
  const isOnline = onlineUserIds.has(conversation.otherParticipant.id);
  const otherReadAt = laterOf(chat.otherReadAtByConversation[conversation.id], conversation.otherLastReadAt);

  // A message that arrives while this conversation is open and visible is
  // read the moment it lands — otherwise the server keeps counting it as
  // unread (badge, list, and the sender's "Đã xem" would all lag until the
  // conversation was reopened). A hidden tab defers this until it's visible.
  const incomingId = latestIncomingId(messages, currentUserId);
  const markRead = chat.markRead;
  const markIncomingRead = useCallback(() => {
    if (!incomingId || incomingId === lastMarkedIncomingId.current) return;
    if (document.visibilityState !== "visible") return;
    lastMarkedIncomingId.current = incomingId;
    markRead(conversation.id);
  }, [incomingId, conversation.id, markRead]);

  useEffect(() => {
    markIncomingRead();
    document.addEventListener("visibilitychange", markIncomingRead);
    return () => document.removeEventListener("visibilitychange", markIncomingRead);
  }, [markIncomingRead]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getMessages(conversation.id, nextCursor);
      chat.hydrateMessages(conversation.id, page.items, "prepend");
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [conversation.id, nextCursor, loadingMore, chat]);

  function handleSend(content: string, attachments: MessageAttachmentInput[]) {
    chat.sendMessage(conversation.id, { content, attachments });
  }

  function handleRetry(message: OptimisticMessage) {
    chat.retryMessage(conversation.id, message);
  }

  async function handleDelete(message: OptimisticMessage) {
    const confirmed = await confirm({
      title: "Xoá tin nhắn này?",
      description: "Tin nhắn sẽ bị xoá với cả hai bên và không thể khôi phục.",
      confirmLabel: "Xoá",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await chat.deleteMessage(message);
    } catch {
      toast.error("Không thể xoá tin nhắn");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConversationHeader conversation={conversation} isOnline={isOnline} />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        otherParticipantName={conversation.otherParticipant.fullName}
        otherReadAt={otherReadAt}
        isOtherTyping={isOtherTyping}
        hasMore={nextCursor !== null}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
        onRetry={handleRetry}
        onEdit={chat.editMessage}
        onDelete={handleDelete}
        readOnly={conversation.isReadOnly}
      />
      {conversation.isReadOnly ? (
        // Deleting your own messages stays possible (see MessageList/bubble);
        // sending and editing are refused by the backend too.
        <p role="status" className="bg-muted text-muted-foreground border-t px-4 py-3 text-center text-sm">
          Đơn ứng tuyển đã kết thúc — hội thoại này chỉ còn để xem lại.
        </p>
      ) : (
        <MessageInput
          onSend={handleSend}
          onTyping={(isTyping) => chat.setTyping(conversation.id, isTyping)}
        />
      )}
      {ConfirmDialog}
    </div>
  );
}
