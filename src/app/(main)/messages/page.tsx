import { redirect } from "next/navigation";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getConversation, getMessages, getMyConversations } from "@/lib/services/chat.service";
import type { Conversation, Message } from "@/lib/types/chat";

interface MessagesPageProps {
  searchParams: Promise<{ conversationId?: string; page?: string }>;
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const { conversationId, page } = await searchParams;
  const { items: conversations, metadata } = await getMyConversations(Number(page) || 1);

  let selected: Conversation | null = null;
  let initialMessages: Message[] = [];
  let initialNextCursor: string | null = null;

  if (conversationId) {
    try {
      [selected, { items: initialMessages, nextCursor: initialNextCursor }] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId),
      ]);
    } catch {
      // Not found, or not a member — fall back to no conversation selected.
      selected = null;
    }
  }

  return (
    <div className="grid h-[70vh] min-h-[500px] grid-cols-1 overflow-hidden rounded-lg border md:grid-cols-[320px_1fr]">
      <div className={selected ? "hidden md:block" : "block"}>
        <ConversationList
          initialConversations={conversations}
          meta={metadata}
          selectedConversationId={selected?.id ?? null}
        />
      </div>
      <div className={selected ? "block" : "hidden md:block"}>
        {selected ? (
          <ChatWindow
            conversation={selected}
            currentUserId={user.id}
            initialMessages={initialMessages}
            initialNextCursor={initialNextCursor}
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Chọn một hội thoại để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
}
