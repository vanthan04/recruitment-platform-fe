"use client";

import { useCallback, useEffect, useState } from "react";
import { useChat, useChatPresence } from "@/contexts/chat-context";
import { ConversationHeader } from "@/components/chat/conversation-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { getMessages } from "@/lib/services/chat.service";
import type { Conversation, Message, MessageAttachmentInput, OptimisticMessage } from "@/lib/types/chat";

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
  const { onlineUserIds } = useChatPresence();
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    chat.hydrateMessages(conversation.id, initialMessages, "replace");
    setNextCursor(initialNextCursor);
    chat.subscribeToConversation(conversation.id);
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConversationHeader conversation={conversation} isOnline={isOnline} />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        otherParticipantName={conversation.otherParticipant.fullName}
        isOtherTyping={isOtherTyping}
        hasMore={nextCursor !== null}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
        onRetry={handleRetry}
      />
      <MessageInput onSend={handleSend} onTyping={(isTyping) => chat.setTyping(conversation.id, isTyping)} />
    </div>
  );
}
