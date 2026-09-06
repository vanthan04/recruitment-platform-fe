"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from "@/components/chat/conversation-item";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { useChat } from "@/contexts/chat-context";
import { getChatSocket } from "@/lib/realtime/socket";
import type { ListMeta } from "@/lib/types/common";
import type { Conversation, Message } from "@/lib/types/chat";

export function ConversationList({
  initialConversations,
  meta,
  selectedConversationId,
}: {
  initialConversations: Conversation[];
  meta?: ListMeta;
  selectedConversationId: string | null;
}) {
  const { onlineUserIds } = useChat();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");

  // Server data changed (new page load / navigation) — resync the local copy.
  useEffect(() => setConversations(initialConversations), [initialConversations]);

  // The active conversation is marked read via the socket as soon as
  // ChatWindow subscribes — reflect that immediately in the list too.
  useEffect(() => {
    if (!selectedConversationId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [selectedConversationId]);

  useEffect(() => {
    const socket = getChatSocket();
    const onMessageNew = (message: Message) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === message.conversationId);
        if (index === -1) return prev;

        const isOpen = message.conversationId === selectedConversationId;
        const updated: Conversation = {
          ...prev[index],
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: isOpen ? 0 : prev[index].unreadCount + 1,
        };
        const next = prev.filter((_, i) => i !== index);
        next.unshift(updated);
        return next;
      });
    };

    socket.on("message:new", onMessageNew);
    return () => {
      socket.off("message:new", onMessageNew);
    };
  }, [selectedConversationId]);

  const filtered = conversations.filter(
    (c) =>
      c.otherParticipant.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(search.toLowerCase()),
  );

  const page = meta?.page ?? 1;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="p-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm hội thoại..."
          aria-label="Tìm kiếm hội thoại"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {filtered.length === 0 && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">Không có hội thoại nào.</p>
          )}
          {filtered.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedConversationId}
              isOnline={onlineUserIds.has(conversation.otherParticipant.id)}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="border-t px-2 py-1">
        <PaginationBar page={page} totalPages={totalPages} onPageChange={goToPage} />
      </div>
    </div>
  );
}
