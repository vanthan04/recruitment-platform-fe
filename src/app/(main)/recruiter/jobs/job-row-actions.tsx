"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApiToast } from "@/hooks/use-api-toast";
import { PATH } from "@/lib/constants/path";
import { closeJob, deleteJob, reopenJob } from "@/lib/services/job.service";
import type { Job } from "@/lib/types/job";

export function JobRowActions({ job }: { job: Job }) {
  const { run, isPending } = useApiToast();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" disabled={isPending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Thao tác</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={PATH.RECRUITER_JOB_EDIT(job.id)}>Chỉnh sửa</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={PATH.RECRUITER_JOB_APPLICATIONS(job.id)}>Xem ứng viên</Link>
        </DropdownMenuItem>
        {job.status === "OPEN" && (
          <DropdownMenuItem onSelect={() => run(() => closeJob(job.id), { successMessage: "Đã đóng tin." })}>
            Đóng tin
          </DropdownMenuItem>
        )}
        {job.status === "CLOSED" && (
          <DropdownMenuItem
            onSelect={() => run(() => reopenJob(job.id), { successMessage: "Đã mở lại tin." })}
          >
            Mở lại tin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            if (confirm("Xoá tin tuyển dụng này?")) {
              run(() => deleteJob(job.id), { successMessage: "Đã xoá tin tuyển dụng." });
            }
          }}
        >
          Xoá
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
