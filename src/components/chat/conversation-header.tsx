import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import type { ApplicationStatus } from "@/lib/types/job-application";
import type { Conversation } from "@/lib/types/chat";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ConversationHeader({
  conversation,
  isOnline,
}: {
  conversation: Conversation;
  isOnline: boolean;
}) {
  const { otherParticipant } = conversation;
  const status = conversation.applicationStatus as ApplicationStatus;

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <div className="relative">
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
        <p className="truncate text-sm font-medium">{otherParticipant.fullName}</p>
        <p className="text-muted-foreground truncate text-xs">{conversation.jobTitle}</p>
      </div>
      {APPLICATION_STATUS_LABEL[status] && (
        <Badge variant="secondary" className="shrink-0">
          {APPLICATION_STATUS_LABEL[status]}
        </Badge>
      )}
    </div>
  );
}
