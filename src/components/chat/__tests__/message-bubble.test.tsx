import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { OptimisticMessage } from "@/lib/types/chat";

const baseMessage: OptimisticMessage = {
  id: "m1",
  conversationId: "c1",
  senderId: "u1",
  content: "Hello there",
  messageType: "TEXT",
  clientMessageId: "client-1",
  isDeleted: false,
  attachments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("MessageBubble", () => {
  it("renders the message content", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows a sending indicator while pending", () => {
    render(<MessageBubble message={{ ...baseMessage, sendStatus: "sending" }} isOwn />);
    expect(screen.getByText("Đang gửi...")).toBeInTheDocument();
  });

  it("shows a retry affordance when the send failed", () => {
    const onRetry = jest.fn();
    render(<MessageBubble message={{ ...baseMessage, sendStatus: "failed" }} isOwn onRetry={onRetry} />);

    expect(screen.getByText("Gửi thất bại")).toBeInTheDocument();
    screen.getByRole("button", { name: "Gửi lại" }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("lists attachments as links", () => {
    render(
      <MessageBubble
        message={{
          ...baseMessage,
          content: "",
          attachments: [
            {
              id: "a1",
              fileName: "resume.pdf",
              fileUrl: "https://example.com/resume.pdf",
              mimeType: "application/pdf",
              fileSize: 1024,
            },
          ],
        }}
        isOwn={false}
      />,
    );
    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
  });
});
