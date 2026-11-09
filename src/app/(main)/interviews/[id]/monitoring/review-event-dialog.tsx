"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { MONITORING_EVENT_LABEL } from "@/lib/constants/enum-label";
import { reviewDetectionEvent } from "@/lib/services/monitoring.service";
import type { DetectionEvent } from "@/lib/types/monitoring";

const MAX_NOTE = 1000;

/** Recruiter only: mark an event as reviewed, with an optional private note. */
export function ReviewEventDialog({ interviewId, event }: { interviewId: string; event: DetectionEvent }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(event.reviewNote ?? "");
  const { run, isPending } = useApiToast();
  const router = useRouter();
  const reviewed = Boolean(event.reviewedAt);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant={reviewed ? "ghost" : "outline"}
        onClick={() => {
          setNote(event.reviewNote ?? "");
          setOpen(true);
        }}
      >
        {reviewed ? "Sửa ghi chú" : "Đánh dấu đã xem"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{MONITORING_EVENT_LABEL[event.eventType]}</DialogTitle>
          <DialogDescription>
            Ghi lại đánh giá của bạn sau khi xem xét. Ghi chú chỉ bạn thấy; ứng viên chỉ thấy sự kiện đã được
            xem.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => reviewDetectionEvent(interviewId, event.id, note.trim() || null), {
              successMessage: "Đã lưu đánh giá.",
              onSuccess: () => {
                setOpen(false);
                router.refresh();
              },
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`review-note-${event.id}`}>Ghi chú (không bắt buộc)</Label>
            <Textarea
              id={`review-note-${event.id}`}
              rows={4}
              maxLength={MAX_NOTE}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: đã hỏi lại ứng viên, đó là đồng hồ hẹn giờ."
            />
            <p className="text-muted-foreground text-right text-xs">
              {note.length}/{MAX_NOTE}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : reviewed ? "Lưu ghi chú" : "Đánh dấu đã xem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
