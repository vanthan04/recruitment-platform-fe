import { render, screen } from "@testing-library/react";
import { ChatWindow } from "@/components/chat/chat-window";
import type { Conversation, OptimisticMessage } from "@/lib/types/chat";

const mockChat = {
  messagesByConversation: {} as Record<string, OptimisticMessage[]>,
  typingByConversation: {},
  otherReadAtByConversation: {},
  hydrateMessages: jest.fn(),
  subscribeToConversation: jest.fn(),
  unsubscribeFromConversation: jest.fn(),
  markRead: jest.fn(),
  sendMessage: jest.fn(),
  retryMessage: jest.fn(),
  setTyping: jest.fn(),
  editMessage: jest.fn(),
  deleteMessage: jest.fn(),
};

jest.mock("@/contexts/chat-context", () => ({
  useChat: () => mockChat,
  useChatPresence: () => ({ onlineUserIds: new Set<string>() }),
}));

jest.mock("@/lib/services/chat.service", () => ({
  getMessages: jest.fn(),
  uploadChatAttachment: jest.fn(),
}));

const ME = "candidate-1";

function makeMessage(
  id: string,
  senderId: string,
  overrides: Partial<OptimisticMessage> = {},
): OptimisticMessage {
  return {
    id,
    conversationId: "conv-1",
    senderId,
    content: `message ${id}`,
    messageType: "TEXT",
    clientMessageId: `client-${id}`,
    isDeleted: false,
    attachments: [],
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv-1",
    status: "ACTIVE",
    jobId: "job-1",
    jobTitle: "Backend Developer",
    applicationId: "app-1",
    applicationStatus: "INTERVIEW",
    isReadOnly: false,
    candidateId: ME,
    recruiterId: "recruiter-1",
    otherParticipant: { id: "recruiter-1", fullName: "Recruiter One", avatarUrl: null, role: "RECRUITER" },
    lastMessage: null,
    unreadCount: 0,
    otherLastReadAt: null,
    lastMessageAt: null,
    createdAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}

function renderWindow(conversation: Conversation, messages: OptimisticMessage[]) {
  mockChat.messagesByConversation = { [conversation.id]: messages };
  return render(
    <ChatWindow
      conversation={conversation}
      currentUserId={ME}
      initialMessages={messages}
      initialNextCursor={null}
    />,
  );
}

describe("ChatWindow", () => {
  beforeEach(() => {
    Object.values(mockChat).forEach((value) => {
      if (typeof value === "function") (value as jest.Mock).mockClear();
    });
  });

  describe("an open conversation", () => {
    it("lets you type a message and edit your own", () => {
      renderWindow(makeConversation(), [makeMessage("m1", ME), makeMessage("m2", "recruiter-1")]);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sửa tin nhắn" })).toBeInTheDocument();
      expect(screen.queryByText(/chỉ còn để xem lại/)).not.toBeInTheDocument();
    });
  });

  describe("a read-only conversation (application REJECTED/WITHDRAWN)", () => {
    const readOnly = () => makeConversation({ isReadOnly: true, applicationStatus: "REJECTED" });

    it("replaces the message input with an explanation", () => {
      renderWindow(readOnly(), [makeMessage("m1", ME)]);

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Đơn ứng tuyển đã kết thúc");
    });

    it("still shows the history", () => {
      renderWindow(readOnly(), [makeMessage("m1", ME), makeMessage("m2", "recruiter-1")]);

      expect(screen.getByText("message m1")).toBeInTheDocument();
      expect(screen.getByText("message m2")).toBeInTheDocument();
    });

    it("hides editing but keeps deleting your own message", () => {
      renderWindow(readOnly(), [makeMessage("m1", ME)]);

      expect(screen.queryByRole("button", { name: "Sửa tin nhắn" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Xoá tin nhắn" })).toBeInTheDocument();
    });

    it("does not offer to retry a send that failed — it would be refused again", () => {
      renderWindow(readOnly(), [makeMessage("m1", ME, { sendStatus: "failed" })]);

      expect(screen.getByText("Gửi thất bại")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Gửi lại" })).not.toBeInTheDocument();
    });

    it("does not tell you to start chatting when there is nothing to read", () => {
      renderWindow(readOnly(), []);

      expect(screen.getByText("Chưa có tin nhắn nào.")).toBeInTheDocument();
      expect(screen.queryByText(/Hãy bắt đầu trò chuyện/)).not.toBeInTheDocument();
    });
  });
});
