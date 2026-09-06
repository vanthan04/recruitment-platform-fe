"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { getChatSocket } from "@/lib/realtime/socket";
import {
  sendMessageFallback,
  markConversationRead as markConversationReadAction,
} from "@/lib/services/chat.service";
import type { CreateMessageInput, Message, MessageType, OptimisticMessage } from "@/lib/types/chat";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface ChatState {
  connectionStatus: ConnectionStatus;
  messagesByConversation: Record<string, OptimisticMessage[]>;
  typingByConversation: Record<string, Set<string>>;
  onlineUserIds: Set<string>;
}

type Action =
  | { type: "status"; status: ConnectionStatus }
  | { type: "hydrate"; conversationId: string; messages: Message[]; mode: "replace" | "prepend" }
  | { type: "optimisticAdd"; conversationId: string; message: OptimisticMessage }
  | { type: "reconcile"; conversationId: string; clientMessageId: string; message: Message }
  | { type: "failed"; clientMessageId: string }
  | { type: "incoming"; conversationId: string; message: Message }
  | { type: "typingStart"; conversationId: string; userId: string }
  | { type: "typingStop"; conversationId: string; userId: string }
  | { type: "presenceOnline"; userId: string }
  | { type: "presenceOffline"; userId: string };

const initialState: ChatState = {
  connectionStatus: "connecting",
  messagesByConversation: {},
  typingByConversation: {},
  onlineUserIds: new Set(),
};

function upsertByClientId(list: OptimisticMessage[], message: OptimisticMessage): OptimisticMessage[] {
  const index = list.findIndex((m) => m.clientMessageId === message.clientMessageId);
  if (index === -1) return [...list, message];
  const next = [...list];
  next[index] = message;
  return next;
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "status":
      return { ...state, connectionStatus: action.status };

    case "hydrate": {
      const existing = state.messagesByConversation[action.conversationId] ?? [];

      if (action.mode === "prepend") {
        return {
          ...state,
          messagesByConversation: {
            ...state.messagesByConversation,
            [action.conversationId]: [...action.messages, ...existing],
          },
        };
      }

      // "replace": the server payload is authoritative for anything it
      // contains, but fold in any messages that only exist locally — e.g.
      // delivered over the socket in the gap between the server fetch and
      // this hydrate call, or still-pending optimistic sends — instead of
      // silently discarding them.
      const serverClientIds = new Set(action.messages.map((m) => m.clientMessageId));
      const localOnly = existing.filter((m) => !serverClientIds.has(m.clientMessageId));
      const merged = [...action.messages, ...localOnly].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      return {
        ...state,
        messagesByConversation: { ...state.messagesByConversation, [action.conversationId]: merged },
      };
    }

    case "optimisticAdd": {
      const existing = state.messagesByConversation[action.conversationId] ?? [];
      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [action.conversationId]: upsertByClientId(existing, action.message),
        },
      };
    }

    case "reconcile": {
      const existing = state.messagesByConversation[action.conversationId] ?? [];
      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [action.conversationId]: upsertByClientId(existing, { ...action.message, sendStatus: "sent" }),
        },
      };
    }

    case "failed": {
      // No conversationId carried on this action (the WS `message:error`
      // event doesn't echo one back), so every conversation's list is
      // checked for the matching pending message — cheap given list sizes.
      const next: Record<string, OptimisticMessage[]> = {};
      for (const [conversationId, messages] of Object.entries(state.messagesByConversation)) {
        next[conversationId] = messages.map((m) =>
          m.clientMessageId === action.clientMessageId ? { ...m, sendStatus: "failed" } : m,
        );
      }
      return { ...state, messagesByConversation: next };
    }

    case "incoming": {
      const existing = state.messagesByConversation[action.conversationId] ?? [];
      return {
        ...state,
        messagesByConversation: {
          ...state.messagesByConversation,
          [action.conversationId]: upsertByClientId(existing, { ...action.message, sendStatus: "sent" }),
        },
      };
    }

    case "typingStart": {
      const set = new Set(state.typingByConversation[action.conversationId] ?? []);
      set.add(action.userId);
      return {
        ...state,
        typingByConversation: { ...state.typingByConversation, [action.conversationId]: set },
      };
    }

    case "typingStop": {
      const set = new Set(state.typingByConversation[action.conversationId] ?? []);
      set.delete(action.userId);
      return {
        ...state,
        typingByConversation: { ...state.typingByConversation, [action.conversationId]: set },
      };
    }

    case "presenceOnline": {
      const set = new Set(state.onlineUserIds);
      set.add(action.userId);
      return { ...state, onlineUserIds: set };
    }

    case "presenceOffline": {
      const set = new Set(state.onlineUserIds);
      set.delete(action.userId);
      return { ...state, onlineUserIds: set };
    }

    default:
      return state;
  }
}

interface ChatContextValue extends Omit<ChatState, "onlineUserIds"> {
  hydrateMessages: (conversationId: string, messages: Message[], mode: "replace" | "prepend") => void;
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, input: Omit<CreateMessageInput, "clientMessageId">) => void;
  retryMessage: (conversationId: string, message: OptimisticMessage) => void;
  markRead: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
}

interface ChatPresenceContextValue {
  onlineUserIds: Set<string>;
}

const ChatContext = createContext<ChatContextValue | null>(null);
// Split out from ChatContext so a presence-only consumer (e.g. the
// conversation list, which just needs to know who's online) doesn't
// re-render on every message/typing action elsewhere in the reducer — the
// reducer already gives each state field a stable reference across actions
// that don't touch it, so these two memos naturally change independently.
const ChatPresenceContext = createContext<ChatPresenceContextValue | null>(null);

export function ChatProvider({ currentUserId, children }: { currentUserId: string; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const socket = getChatSocket();
    socket.connect();
    dispatch({ type: "status", status: "connecting" });

    const onConnect = () => dispatch({ type: "status", status: "connected" });
    const onDisconnect = () => dispatch({ type: "status", status: "disconnected" });
    const onMessageNew = (message: Message) =>
      dispatch({ type: "incoming", conversationId: message.conversationId, message });
    const onMessageAck = ({ message }: { clientMessageId: string; message: Message }) =>
      dispatch({
        type: "reconcile",
        conversationId: message.conversationId,
        clientMessageId: message.clientMessageId,
        message,
      });
    const onMessageError = ({ clientMessageId }: { clientMessageId: string; message: string }) =>
      dispatch({ type: "failed", clientMessageId });
    const onTypingStart = (data: { conversationId: string; userId: string }) =>
      dispatch({ type: "typingStart", ...data });
    const onTypingStop = (data: { conversationId: string; userId: string }) =>
      dispatch({ type: "typingStop", ...data });
    const onPresenceOnline = (data: { userId: string }) => dispatch({ type: "presenceOnline", ...data });
    const onPresenceOffline = (data: { userId: string }) => dispatch({ type: "presenceOffline", ...data });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onMessageNew);
    socket.on("message:ack", onMessageAck);
    socket.on("message:error", onMessageError);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("user:online", onPresenceOnline);
    socket.on("user:offline", onPresenceOffline);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onMessageNew);
      socket.off("message:ack", onMessageAck);
      socket.off("message:error", onMessageError);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("user:online", onPresenceOnline);
      socket.off("user:offline", onPresenceOffline);
      socket.disconnect();

      // Drop any pending typing-stop timers (see setTyping below) so they
      // don't fire after this provider — and the socket — are gone.
      for (const timeout of Object.values(typingTimeoutRef.current)) {
        clearTimeout(timeout);
      }
      typingTimeoutRef.current = {};
    };
  }, []);

  const hydrateMessages = useCallback(
    (conversationId: string, messages: Message[], mode: "replace" | "prepend") =>
      dispatch({ type: "hydrate", conversationId, messages, mode }),
    [],
  );

  const subscribeToConversation = useCallback((conversationId: string) => {
    getChatSocket().emit("conversation:subscribe", { conversationId });
  }, []);

  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    getChatSocket().emit("conversation:unsubscribe", { conversationId });
  }, []);

  const doSend = useCallback(
    (conversationId: string, optimistic: OptimisticMessage, input: CreateMessageInput) => {
      dispatch({ type: "optimisticAdd", conversationId, message: optimistic });
      const socket = getChatSocket();

      if (socket.connected) {
        socket.emit("message:send", { conversationId, ...input });
        // Resolved via the "message:ack"/"message:new" listeners above.
        return;
      }

      // Socket not connected — fall back to the REST endpoint (same backend
      // handler, deduped by clientMessageId either way).
      sendMessageFallback(conversationId, input)
        .then((message) =>
          dispatch({ type: "reconcile", conversationId, clientMessageId: input.clientMessageId, message }),
        )
        .catch(() => dispatch({ type: "failed", clientMessageId: input.clientMessageId }));
    },
    [],
  );

  const sendMessage = useCallback(
    (conversationId: string, input: Omit<CreateMessageInput, "clientMessageId">) => {
      const clientMessageId = crypto.randomUUID();
      const now = new Date().toISOString();
      const optimistic: OptimisticMessage = {
        id: `pending-${clientMessageId}`,
        conversationId,
        senderId: currentUserId,
        content: input.content,
        messageType: (input.messageType ?? "TEXT") as MessageType,
        clientMessageId,
        isDeleted: false,
        attachments: (input.attachments ?? []).map((a, i) => ({ id: `pending-${i}`, ...a })),
        createdAt: now,
        updatedAt: now,
        sendStatus: "sending",
      };
      doSend(conversationId, optimistic, { ...input, clientMessageId });
    },
    [currentUserId, doSend],
  );

  const retryMessage = useCallback(
    (conversationId: string, message: OptimisticMessage) => {
      const optimistic: OptimisticMessage = { ...message, sendStatus: "sending" };
      doSend(conversationId, optimistic, {
        content: message.content,
        messageType: message.messageType,
        clientMessageId: message.clientMessageId,
        attachments: message.attachments.map(({ fileName, fileUrl, mimeType, fileSize }) => ({
          fileName,
          fileUrl,
          mimeType,
          fileSize,
        })),
      });
    },
    [doSend],
  );

  const markRead = useCallback((conversationId: string) => {
    getChatSocket().emit("message:read", { conversationId });
    void markConversationReadAction(conversationId);
  }, []);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const socket = getChatSocket();
    const timeouts = typingTimeoutRef.current;

    if (isTyping) {
      if (!timeouts[conversationId]) {
        socket.emit("typing:start", { conversationId });
      }
      clearTimeout(timeouts[conversationId]);
      timeouts[conversationId] = setTimeout(() => {
        socket.emit("typing:stop", { conversationId });
        delete timeouts[conversationId];
      }, 2000);
    } else {
      clearTimeout(timeouts[conversationId]);
      delete timeouts[conversationId];
      socket.emit("typing:stop", { conversationId });
    }
  }, []);

  const value: ChatContextValue = useMemo(
    () => ({
      connectionStatus: state.connectionStatus,
      messagesByConversation: state.messagesByConversation,
      typingByConversation: state.typingByConversation,
      hydrateMessages,
      subscribeToConversation,
      unsubscribeFromConversation,
      sendMessage,
      retryMessage,
      markRead,
      setTyping,
    }),
    [
      state.connectionStatus,
      state.messagesByConversation,
      state.typingByConversation,
      hydrateMessages,
      subscribeToConversation,
      unsubscribeFromConversation,
      sendMessage,
      retryMessage,
      markRead,
      setTyping,
    ],
  );

  const presenceValue: ChatPresenceContextValue = useMemo(
    () => ({ onlineUserIds: state.onlineUserIds }),
    [state.onlineUserIds],
  );

  return (
    <ChatContext.Provider value={value}>
      <ChatPresenceContext.Provider value={presenceValue}>{children}</ChatPresenceContext.Provider>
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}

/** Presence-only slice of chat state — re-renders solely on online/offline changes. */
export function useChatPresence(): ChatPresenceContextValue {
  const context = useContext(ChatPresenceContext);
  if (!context) throw new Error("useChatPresence must be used within a ChatProvider");
  return context;
}
