import { render, screen, fireEvent } from "@testing-library/react";
import { act, useEffect } from "react";
import { ChatProvider, useChat } from "@/contexts/chat-context";
import { editMessage, deleteMessage, markConversationRead } from "@/lib/services/chat.service";
import { UNREAD_MESSAGES_CHANGED_EVENT } from "@/lib/realtime/unread-messages";

type Listener = (...args: unknown[]) => void;

function createMockSocket() {
  const listeners: Record<string, Listener[]> = {};
  return {
    connected: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn((event: string, cb: Listener) => {
      (listeners[event] ??= []).push(cb);
    }),
    off: jest.fn((event: string, cb: Listener) => {
      listeners[event] = (listeners[event] ?? []).filter((l) => l !== cb);
    }),
    trigger(event: string, payload: unknown) {
      for (const cb of listeners[event] ?? []) cb(payload);
    },
  };
}

const mockSocket = createMockSocket();

jest.mock("@/lib/realtime/socket", () => ({
  getChatSocket: () => mockSocket,
}));

jest.mock("@/lib/services/chat.service", () => ({
  sendMessageFallback: jest.fn(),
  markConversationRead: jest.fn(),
  editMessage: jest.fn(),
  deleteMessage: jest.fn(),
}));

function TestConsumer({ conversationId }: { conversationId: string }) {
  const chat = useChat();
  const messages = chat.messagesByConversation[conversationId] ?? [];

  return (
    <div>
      <button onClick={() => chat.sendMessage(conversationId, { content: "Hi there" })}>send</button>
      <button onClick={() => void chat.editMessage(messages[0], "Edited via REST")}>edit</button>
      <button onClick={() => void chat.deleteMessage(messages[0])}>delete</button>
      <ul>
        {messages.map((m) => (
          <li key={m.clientMessageId}>
            {m.content} — {m.sendStatus ?? "none"}
            {m.isDeleted ? " (deleted)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubscribingConsumer({ conversationId }: { conversationId: string }) {
  const chat = useChat();

  useEffect(() => {
    chat.subscribeToConversation(conversationId);
    return () => chat.unsubscribeFromConversation(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return null;
}

describe("ChatProvider / useChat", () => {
  beforeEach(() => {
    mockSocket.emit.mockClear();
  });

  it("adds an optimistic 'sending' message immediately, then reconciles on ack", () => {
    render(
      <ChatProvider currentUserId="candidate-1">
        <TestConsumer conversationId="conv-1" />
      </ChatProvider>,
    );

    fireEvent.click(screen.getByText("send"));

    expect(screen.getByText("Hi there — sending")).toBeInTheDocument();

    const [, sentPayload] = mockSocket.emit.mock.calls.find(([event]) => event === "message:send")!;
    const clientMessageId = (sentPayload as { clientMessageId: string }).clientMessageId;

    act(() => {
      mockSocket.trigger("message:ack", {
        clientMessageId,
        message: {
          id: "m1",
          conversationId: "conv-1",
          senderId: "candidate-1",
          content: "Hi there",
          messageType: "TEXT",
          clientMessageId,
          isDeleted: false,
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    });

    expect(screen.getByText("Hi there — sent")).toBeInTheDocument();
    expect(screen.queryByText("Hi there — sending")).not.toBeInTheDocument();
  });

  it("does not duplicate a message when the broadcast echo arrives for a message already sent locally", () => {
    render(
      <ChatProvider currentUserId="candidate-1">
        <TestConsumer conversationId="conv-1" />
      </ChatProvider>,
    );

    fireEvent.click(screen.getByText("send"));
    const [, sentPayload] = mockSocket.emit.mock.calls.find(([event]) => event === "message:send")!;
    const clientMessageId = (sentPayload as { clientMessageId: string }).clientMessageId;

    act(() => {
      mockSocket.trigger("message:new", {
        id: "m1",
        conversationId: "conv-1",
        senderId: "candidate-1",
        content: "Hi there",
        messageType: "TEXT",
        clientMessageId,
        isDeleted: false,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    expect(screen.getAllByText(/Hi there/)).toHaveLength(1);
  });

  it("re-subscribes to the open conversation after the socket reconnects", () => {
    render(
      <ChatProvider currentUserId="candidate-1">
        <SubscribingConsumer conversationId="conv-1" />
      </ChatProvider>,
    );

    const subscribeCalls = () =>
      mockSocket.emit.mock.calls.filter(
        ([event, payload]) =>
          event === "conversation:subscribe" &&
          (payload as { conversationId: string }).conversationId === "conv-1",
      );

    expect(subscribeCalls()).toHaveLength(1);

    // Socket.IO's own `reconnection: true` reconnects the transport silently
    // after a drop — the server doesn't remember a fresh socket's prior
    // subscriptions, so the provider must re-emit on every "connect", not
    // just the first one.
    act(() => {
      mockSocket.trigger("disconnect", undefined);
      mockSocket.trigger("connect", undefined);
    });

    expect(subscribeCalls()).toHaveLength(2);
  });

  describe("edit / delete", () => {
    const baseMessage = (clientMessageId: string, overrides: Record<string, unknown> = {}) => ({
      id: "m1",
      conversationId: "conv-1",
      senderId: "candidate-1",
      content: "Original",
      messageType: "TEXT",
      clientMessageId,
      isDeleted: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    });

    function renderWithMessage() {
      render(
        <ChatProvider currentUserId="candidate-1">
          <TestConsumer conversationId="conv-1" />
        </ChatProvider>,
      );
      act(() => {
        mockSocket.trigger("message:new", baseMessage("c1"));
      });
    }

    it("replaces the content in place when a message:updated broadcast arrives", () => {
      renderWithMessage();

      act(() => {
        mockSocket.trigger("message:updated", baseMessage("c1", { content: "Edited" }));
      });

      expect(screen.getByText(/Edited — sent/)).toBeInTheDocument();
      expect(screen.queryByText(/Original/)).not.toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("marks the message deleted when a message:deleted broadcast arrives", () => {
      renderWithMessage();

      act(() => {
        mockSocket.trigger(
          "message:deleted",
          baseMessage("c1", { content: "Tin nhắn này đã bị xoá", isDeleted: true }),
        );
      });

      expect(screen.getByText(/Tin nhắn này đã bị xoá — sent \(deleted\)/)).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("ignores an edit for a message this client never loaded instead of appending it", () => {
      renderWithMessage();

      act(() => {
        mockSocket.trigger("message:updated", baseMessage("unknown", { id: "m9", content: "Stray" }));
        mockSocket.trigger(
          "message:updated",
          baseMessage("c2", { id: "m8", conversationId: "other-conv", content: "Elsewhere" }),
        );
      });

      expect(screen.queryByText(/Stray/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Elsewhere/)).not.toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("applies the REST result immediately when editing, without waiting for the socket", async () => {
      (editMessage as jest.Mock).mockResolvedValue(baseMessage("c1", { content: "Edited via REST" }));
      renderWithMessage();

      await act(async () => {
        fireEvent.click(screen.getByText("edit"));
      });

      expect(editMessage).toHaveBeenCalledWith("m1", "Edited via REST");
      expect(screen.getByText(/Edited via REST — sent/)).toBeInTheDocument();
    });

    it("applies the REST result immediately when deleting", async () => {
      (deleteMessage as jest.Mock).mockResolvedValue(
        baseMessage("c1", { content: "Tin nhắn này đã bị xoá", isDeleted: true }),
      );
      renderWithMessage();

      await act(async () => {
        fireEvent.click(screen.getByText("delete"));
      });

      expect(deleteMessage).toHaveBeenCalledWith("m1");
      expect(screen.getByText(/\(deleted\)/)).toBeInTheDocument();
    });
  });

  describe("read receipts and unread notifications", () => {
    function ReadConsumer({ conversationId, open = false }: { conversationId: string; open?: boolean }) {
      const chat = useChat();

      useEffect(() => {
        if (!open) return;
        chat.subscribeToConversation(conversationId);
        return () => chat.unsubscribeFromConversation(conversationId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [conversationId, open]);

      return (
        <div>
          <span data-testid="other-read">{chat.otherReadAtByConversation[conversationId] ?? "never"}</span>
          <button onClick={() => chat.markRead(conversationId)}>mark</button>
        </div>
      );
    }

    const incoming = (senderId: string) => ({
      id: "m1",
      conversationId: "conv-1",
      senderId,
      content: "hello",
      messageType: "TEXT",
      clientMessageId: "c1",
      isDeleted: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let onUnreadChanged: jest.Mock;

    beforeEach(() => {
      onUnreadChanged = jest.fn();
      window.addEventListener(UNREAD_MESSAGES_CHANGED_EVENT, onUnreadChanged);
      (markConversationRead as jest.Mock).mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
      window.removeEventListener(UNREAD_MESSAGES_CHANGED_EVENT, onUnreadChanged);
    });

    function renderConsumer(open = false) {
      render(
        <ChatProvider currentUserId="candidate-1">
          <ReadConsumer conversationId="conv-1" open={open} />
        </ChatProvider>,
      );
    }

    it("records when the other participant read the conversation", () => {
      renderConsumer();
      expect(screen.getByTestId("other-read")).toHaveTextContent("never");

      act(() => {
        mockSocket.trigger("message:read", {
          conversationId: "conv-1",
          userId: "recruiter-1",
          readAt: "2026-01-01T10:00:00.000Z",
        });
      });

      expect(screen.getByTestId("other-read")).toHaveTextContent("2026-01-01T10:00:00.000Z");
    });

    it("ignores the echo of my own read — only the other side's read is a 'seen' receipt", () => {
      renderConsumer();

      act(() => {
        mockSocket.trigger("message:read", {
          conversationId: "conv-1",
          userId: "candidate-1",
          readAt: "2026-01-01T10:00:00.000Z",
        });
      });

      expect(screen.getByTestId("other-read")).toHaveTextContent("never");
    });

    it("never moves the seen time backwards on a late or out-of-order event", () => {
      renderConsumer();

      act(() => {
        mockSocket.trigger("message:read", {
          conversationId: "conv-1",
          userId: "recruiter-1",
          readAt: "2026-01-01T10:05:00.000Z",
        });
        mockSocket.trigger("message:read", {
          conversationId: "conv-1",
          userId: "recruiter-1",
          readAt: "2026-01-01T10:00:00.000Z",
        });
      });

      expect(screen.getByTestId("other-read")).toHaveTextContent("2026-01-01T10:05:00.000Z");
    });

    it("announces a possible unread change when someone else's message arrives in a conversation that isn't open", () => {
      renderConsumer(false);

      act(() => {
        mockSocket.trigger("message:new", incoming("recruiter-1"));
      });

      expect(onUnreadChanged).toHaveBeenCalledTimes(1);
    });

    it("does not announce for my own message", () => {
      renderConsumer(false);

      act(() => {
        mockSocket.trigger("message:new", incoming("candidate-1"));
      });

      expect(onUnreadChanged).not.toHaveBeenCalled();
    });

    it("does not announce for an incoming message in the conversation that is open (it is read at once)", () => {
      renderConsumer(true);

      act(() => {
        mockSocket.trigger("message:new", incoming("recruiter-1"));
      });

      expect(onUnreadChanged).not.toHaveBeenCalled();
    });

    it("tells the server and then announces the change once a conversation is marked read", async () => {
      renderConsumer(true);

      await act(async () => {
        fireEvent.click(screen.getByText("mark"));
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("message:read", { conversationId: "conv-1" });
      expect(markConversationRead).toHaveBeenCalledWith("conv-1");
      expect(onUnreadChanged).toHaveBeenCalledTimes(1);
    });

    it("still announces (and does not throw) when the mark-read request fails", async () => {
      (markConversationRead as jest.Mock).mockRejectedValue(new Error("network"));
      renderConsumer(true);

      await act(async () => {
        fireEvent.click(screen.getByText("mark"));
      });

      expect(onUnreadChanged).toHaveBeenCalledTimes(1);
    });
  });
});
