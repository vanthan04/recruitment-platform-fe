export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
export type ConversationStatus = "ACTIVE" | "ARCHIVED";

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  /**
   * Set only on a not-yet-sent optimistic attachment (see chat-context.tsx
   * sendMessage/retryMessage) so a retry can resend the original upload
   * reference — `fileUrl` is empty/unusable until the server resolves it,
   * since the client never has a real URL for a private chat-attachments key.
   */
  fileKey?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  clientMessageId: string;
  isDeleted: boolean;
  attachments: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export interface Conversation {
  id: string;
  status: ConversationStatus;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  applicationStatus: string;
  candidateId: string;
  recruiterId: string;
  otherParticipant: ConversationParticipant;
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface MessagePage {
  items: Message[];
  nextCursor: string | null;
}

export interface MessageAttachmentInput {
  fileName: string;
  /** Storage key returned by uploadChatAttachment() — never a URL. */
  fileKey: string;
  mimeType: string;
  fileSize: number;
}

export interface CreateMessageInput {
  content: string;
  messageType?: MessageType;
  clientMessageId: string;
  attachments?: MessageAttachmentInput[];
}

/** Client-only send state — not part of the wire shape. */
export type MessageSendStatus = "sending" | "sent" | "failed";

export interface OptimisticMessage extends Message {
  sendStatus?: MessageSendStatus;
}
