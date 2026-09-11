import { render, screen, fireEvent } from "@testing-library/react";
import { act, useEffect } from "react";
import { ChatProvider, useChat } from "@/contexts/chat-context";

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
}));

function TestConsumer({ conversationId }: { conversationId: string }) {
  const chat = useChat();
  const messages = chat.messagesByConversation[conversationId] ?? [];

  return (
    <div>
      <button onClick={() => chat.sendMessage(conversationId, { content: "Hi there" })}>send</button>
      <ul>
        {messages.map((m) => (
          <li key={m.clientMessageId}>
            {m.content} — {m.sendStatus ?? "none"}
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
});
