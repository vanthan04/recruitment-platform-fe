import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  describe("system line", () => {
    const system: OptimisticMessage = {
      ...baseMessage,
      id: "sys1",
      messageType: "SYSTEM",
      content: 'Đơn ứng tuyển đã chuyển sang trạng thái "Phỏng vấn".',
    };

    it("renders as a centred note rather than a chat bubble", () => {
      render(<MessageBubble message={system} isOwn={false} />);
      expect(screen.getByRole("note")).toHaveTextContent(
        'Đơn ứng tuyển đã chuyển sang trạng thái "Phỏng vấn".',
      );
    });

    it("offers no edit, delete, seen marker or retry — even when attributed to you", () => {
      render(
        <MessageBubble
          message={{ ...system, sendStatus: "failed" }}
          isOwn
          isSeen
          onRetry={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByText(/Đã xem/)).not.toBeInTheDocument();
      expect(screen.queryByText("Gửi thất bại")).not.toBeInTheDocument();
    });
  });

  describe("seen receipt", () => {
    it("shows 'Đã xem' on your own message once it is marked seen", () => {
      render(<MessageBubble message={baseMessage} isOwn isSeen />);
      expect(screen.getByText(/Đã xem/)).toBeInTheDocument();
    });

    it("does not show 'Đã xem' when not seen, or on the other person's message", () => {
      const { rerender } = render(<MessageBubble message={baseMessage} isOwn />);
      expect(screen.queryByText(/Đã xem/)).not.toBeInTheDocument();

      rerender(<MessageBubble message={baseMessage} isOwn={false} isSeen />);
      expect(screen.queryByText(/Đã xem/)).not.toBeInTheDocument();
    });
  });

  describe("edit / delete", () => {
    it("offers edit and delete on your own persisted text message", () => {
      render(<MessageBubble message={baseMessage} isOwn onEdit={jest.fn()} onDelete={jest.fn()} />);
      expect(screen.getByRole("button", { name: "Sửa tin nhắn" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Xoá tin nhắn" })).toBeInTheDocument();
    });

    it("does not offer edit/delete on someone else's message", () => {
      render(<MessageBubble message={baseMessage} isOwn={false} onEdit={jest.fn()} onDelete={jest.fn()} />);
      expect(screen.queryByRole("button", { name: "Sửa tin nhắn" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Xoá tin nhắn" })).not.toBeInTheDocument();
    });

    it("does not offer edit/delete on a deleted or still-pending message", () => {
      const { rerender } = render(
        <MessageBubble
          message={{ ...baseMessage, isDeleted: true }}
          isOwn
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );
      expect(screen.queryByRole("button", { name: "Sửa tin nhắn" })).not.toBeInTheDocument();

      rerender(
        <MessageBubble
          message={{ ...baseMessage, id: "pending-client-1", sendStatus: "sending" }}
          isOwn
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );
      expect(screen.queryByRole("button", { name: "Xoá tin nhắn" })).not.toBeInTheDocument();
    });

    it("does not offer edit on a non-text message, but still allows delete", () => {
      render(
        <MessageBubble
          message={{ ...baseMessage, messageType: "FILE" }}
          isOwn
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />,
      );
      expect(screen.queryByRole("button", { name: "Sửa tin nhắn" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Xoá tin nhắn" })).toBeInTheDocument();
    });

    it("calls onDelete when the delete button is clicked", () => {
      const onDelete = jest.fn();
      render(<MessageBubble message={baseMessage} isOwn onEdit={jest.fn()} onDelete={onDelete} />);
      fireEvent.click(screen.getByRole("button", { name: "Xoá tin nhắn" }));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("saves a trimmed edit via onEdit and leaves edit mode", async () => {
      const onEdit = jest.fn().mockResolvedValue(undefined);
      render(<MessageBubble message={baseMessage} isOwn onEdit={onEdit} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Sửa tin nhắn" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Sửa tin nhắn" }), {
        target: { value: "  Updated text  " },
      });
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

      await waitFor(() => expect(onEdit).toHaveBeenCalledWith("Updated text"));
      await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
    });

    it("does not call onEdit when the text is unchanged or cancelled", () => {
      const onEdit = jest.fn();
      render(<MessageBubble message={baseMessage} isOwn onEdit={onEdit} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Sửa tin nhắn" }));
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Sửa tin nhắn" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Sửa tin nhắn" }), {
        target: { value: "Changed" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
      expect(onEdit).not.toHaveBeenCalled();
      expect(screen.getByText("Hello there")).toBeInTheDocument();
    });

    it("stays in edit mode with the draft intact when saving fails", async () => {
      const onEdit = jest.fn().mockRejectedValue(new Error("boom"));
      render(<MessageBubble message={baseMessage} isOwn onEdit={onEdit} onDelete={jest.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Sửa tin nhắn" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Sửa tin nhắn" }), {
        target: { value: "Retry me" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

      await waitFor(() => expect(onEdit).toHaveBeenCalled());
      expect(screen.getByRole("textbox", { name: "Sửa tin nhắn" })).toHaveValue("Retry me");
    });

    it("shows an 'edited' marker only when updatedAt is meaningfully later than createdAt", () => {
      const created = new Date("2026-01-01T10:00:00Z");
      const { rerender } = render(
        <MessageBubble
          message={{
            ...baseMessage,
            createdAt: created.toISOString(),
            updatedAt: new Date(created.getTime() + 5).toISOString(),
          }}
          isOwn
        />,
      );
      expect(screen.queryByText(/đã chỉnh sửa/)).not.toBeInTheDocument();

      rerender(
        <MessageBubble
          message={{
            ...baseMessage,
            createdAt: created.toISOString(),
            updatedAt: new Date(created.getTime() + 60_000).toISOString(),
          }}
          isOwn
        />,
      );
      expect(screen.getByText(/đã chỉnh sửa/)).toBeInTheDocument();
    });
  });
});
