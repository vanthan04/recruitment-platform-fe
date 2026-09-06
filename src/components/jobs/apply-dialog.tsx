"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { applyToJob } from "@/lib/services/job-application.service";
import type { Cv } from "@/lib/types/cv";

interface ApplyDialogProps {
  jobId: string;
  cvs: Cv[];
}

export function ApplyDialog({ jobId, cvs }: ApplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [cvId, setCvId] = useState(cvs[0]?.id ?? "");
  const [coverLetter, setCoverLetter] = useState("");
  const { run, isPending } = useApiToast();
  const router = useRouter();

  function handleSubmit() {
    if (!cvId) return;
    run(() => applyToJob({ jobId, cvId, coverLetter: coverLetter || undefined }), {
      successMessage: "Nộp đơn ứng tuyển thành công!",
      onSuccess: () => {
        setOpen(false);
        // The job detail page's `hasApplied` prop is computed server-side —
        // without this it stays stale and "Ứng tuyển ngay" keeps showing
        // after a successful apply, until an unrelated navigation/reload.
        router.refresh();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" className="w-full" onClick={() => setOpen(true)}>
        Ứng tuyển ngay
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ứng tuyển công việc</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Chọn CV</Label>
            <Select value={cvId} onValueChange={setCvId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn CV đã xuất bản" />
              </SelectTrigger>
              <SelectContent>
                {cvs.map((cv) => (
                  <SelectItem key={cv.id} value={cv.id}>
                    {cv.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coverLetter">Thư giới thiệu (không bắt buộc)</Label>
            <Textarea
              id="coverLetter"
              rows={4}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending || !cvId} onClick={handleSubmit}>
            {isPending ? "Đang nộp..." : "Nộp đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
