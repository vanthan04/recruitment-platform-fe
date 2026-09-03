"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { rescheduleInterview, scheduleInterview } from "@/lib/services/interview.service";
import type { Interview } from "@/lib/types/interview";

const interviewSchema = z
  .object({
    scheduledAt: z.string().min(1, "Vui lòng chọn thời gian phỏng vấn"),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((values) => Boolean(values.location) || Boolean(values.meetingLink), {
    message: "Cần nhập địa điểm hoặc link phỏng vấn (ít nhất một trong hai)",
    path: ["location"],
  });

type InterviewFormValues = z.infer<typeof interviewSchema>;

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface InterviewDialogProps {
  applicationId: string;
  interview?: Interview;
}

export function InterviewDialog({ applicationId, interview }: InterviewDialogProps) {
  const [open, setOpen] = useState(false);
  const { run, isPending } = useApiToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    values: {
      scheduledAt: interview ? toDatetimeLocal(interview.scheduledAt) : "",
      location: interview?.location ?? "",
      meetingLink: interview?.meetingLink ?? "",
      note: interview?.note ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const input = {
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      location: values.location || undefined,
      meetingLink: values.meetingLink || undefined,
      note: values.note || undefined,
    };

    const action = interview
      ? () => rescheduleInterview(interview.id, input)
      : () => scheduleInterview({ jobApplicationId: applicationId, ...input });

    run(action, {
      successMessage: interview ? "Đã dời lịch phỏng vấn." : "Đã lên lịch phỏng vấn.",
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        {interview ? "Dời lịch" : "Lên lịch phỏng vấn"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{interview ? "Dời lịch phỏng vấn" : "Lên lịch phỏng vấn"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">Thời gian</Label>
            <Input id="scheduledAt" type="datetime-local" {...register("scheduledAt")} />
            {errors.scheduledAt && <p className="text-destructive text-sm">{errors.scheduledAt.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Địa điểm</Label>
            <Input id="location" placeholder="Địa chỉ phỏng vấn trực tiếp" {...register("location")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meetingLink">Link phỏng vấn online</Label>
            <Input id="meetingLink" placeholder="https://meet.google.com/..." {...register("meetingLink")} />
            {errors.location && <p className="text-destructive text-sm">{errors.location.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" rows={3} {...register("note")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
