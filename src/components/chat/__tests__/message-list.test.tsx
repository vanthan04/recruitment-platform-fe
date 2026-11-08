import { findLastSeenOwnMessageId } from "@/components/chat/message-list";
import type { OptimisticMessage } from "@/lib/types/chat";

const ME = "me";
const THEM = "them";

function msg(
  id: string,
  senderId: string,
  createdAt: string,
  overrides: Partial<OptimisticMessage> = {},
): OptimisticMessage {
  return {
    id,
    conversationId: "c1",
    senderId,
    content: id,
    messageType: "TEXT",
    clientMessageId: `client-${id}`,
    isDeleted: false,
    attachments: [],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe("findLastSeenOwnMessageId", () => {
  const messages = [
    msg("a", ME, "2026-01-01T10:00:00Z"),
    msg("b", THEM, "2026-01-01T10:01:00Z"),
    msg("c", ME, "2026-01-01T10:02:00Z"),
    msg("d", ME, "2026-01-01T10:05:00Z"),
  ];

  it("returns null when the other participant has never read the conversation", () => {
    expect(findLastSeenOwnMessageId(messages, ME, null)).toBeNull();
    expect(findLastSeenOwnMessageId(messages, ME, undefined)).toBeNull();
  });

  it("marks only the latest of my messages that was read — not every one", () => {
    // They read at 10:03 → saw a and c, not the later d.
    expect(findLastSeenOwnMessageId(messages, ME, "2026-01-01T10:03:00Z")).toBe("c");
  });

  it("marks the newest message once they have read past it", () => {
    expect(findLastSeenOwnMessageId(messages, ME, "2026-01-01T11:00:00Z")).toBe("d");
  });

  it("treats a message sent at exactly the read time as seen", () => {
    expect(findLastSeenOwnMessageId(messages, ME, "2026-01-01T10:05:00Z")).toBe("d");
  });

  it("returns null when they read before any of my messages", () => {
    expect(findLastSeenOwnMessageId(messages, ME, "2025-12-31T00:00:00Z")).toBeNull();
  });

  it("skips my messages that are still sending, failed, or deleted", () => {
    const withUnsettled = [
      msg("a", ME, "2026-01-01T10:00:00Z"),
      msg("pending", ME, "2026-01-01T10:01:00Z", { sendStatus: "sending" }),
      msg("failed", ME, "2026-01-01T10:02:00Z", { sendStatus: "failed" }),
      msg("gone", ME, "2026-01-01T10:03:00Z", { isDeleted: true }),
    ];
    expect(findLastSeenOwnMessageId(withUnsettled, ME, "2026-01-01T12:00:00Z")).toBe("a");
  });

  it("never marks a system line as seen, even though it is stored under my id", () => {
    const withSystem = [
      msg("a", ME, "2026-01-01T10:00:00Z"),
      msg("sys", ME, "2026-01-01T10:02:00Z", { messageType: "SYSTEM" }),
    ];
    // They read after both — the marker belongs on my real message, not the note.
    expect(findLastSeenOwnMessageId(withSystem, ME, "2026-01-01T12:00:00Z")).toBe("a");
  });

  it("ignores the other person's messages entirely", () => {
    const onlyTheirs = [msg("x", THEM, "2026-01-01T10:00:00Z")];
    expect(findLastSeenOwnMessageId(onlyTheirs, ME, "2026-01-01T12:00:00Z")).toBeNull();
  });
});
