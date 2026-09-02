"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PaperclipIcon, SendIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uploadChatAttachment } from "@/lib/services/chat.service";
import type { MessageAttachmentInput } from "@/lib/types/chat";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function MessageInput({
  onSend,
  onTyping,
  disabled,
}: {
  onSend: (content: string, attachments: MessageAttachmentInput[]) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachmentInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (attachments.length >= MAX_ATTACHMENTS) {
      toast.error(`Chỉ được đính kèm tối đa ${MAX_ATTACHMENTS} tệp`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Tệp không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await uploadChatAttachment(formData);
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileUrl: url,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        },
      ]);
    } catch {
      toast.error("Tải tệp lên thất bại");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (!content.trim() && attachments.length === 0) return;
    onSend(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    onTyping(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <span
              key={`${attachment.fileUrl}-${index}`}
              className="bg-muted flex items-center gap-1 rounded-full px-2 py-1 text-xs"
            >
              <span className="max-w-32 truncate">{attachment.fileName}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                aria-label={`Xoá ${attachment.fileName}`}
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || attachments.length >= MAX_ATTACHMENTS}
          aria-label="Đính kèm tệp"
        >
          <PaperclipIcon className="size-4" />
        </Button>
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onTyping(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={disabled}
          rows={1}
          className="max-h-32 flex-1 resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || uploading || (!content.trim() && attachments.length === 0)}
          aria-label="Gửi tin nhắn"
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </form>
  );
}
