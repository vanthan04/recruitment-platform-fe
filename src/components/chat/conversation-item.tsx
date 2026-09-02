import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMessageTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { PATH } from "@/lib/constants/path";
import type { Conversation } from "@/lib/types/chat";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ConversationItem({
  conversation,
  isSelected,
  isOnline,
}: {
  conversation: Conversation;
  isSelected: boolean;
  isOnline: boolean;
}) {
  const { otherParticipant, lastMessage } = conversation;
  const preview = lastMessage
    ? lastMessage.isDeleted
      ? "Tin nhắn đã bị xoá"
      : lastMessage.content
    : "Chưa có tin nhắn";

  return (
    <Link
      href={`${PATH.MESSAGES}?conversationId=${conversation.id}`}
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
        isSelected ? "bg-muted" : "hover:bg-muted/50",
      )}
    >
      <div className="relative shrink-0">
        <Avatar>
          {otherParticipant.avatarUrl && (
            <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.fullName} />
          )}
          <AvatarFallback>{initials(otherParticipant.fullName)}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="border-background absolute right-0 bottom-0 size-2.5 rounded-full border-2 bg-green-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{otherParticipant.fullName}</p>
          {conversation.lastMessageAt && (
            <span className="text-muted-foreground shrink-0 text-[0.7rem]">
              {formatMessageTime(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">{conversation.jobTitle}</p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
          {conversation.unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-4 min-w-4 shrink-0 justify-center rounded-full px-1 text-[0.65rem]"
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
