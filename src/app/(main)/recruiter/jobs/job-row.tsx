import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Job } from "@/lib/types/job";
import { formatRelativeDate } from "@/lib/utils";
import { JobRowActions } from "./job-row-actions";

const STATUS_VARIANT: Record<Job["status"], "default" | "secondary" | "outline"> = {
  OPEN: "default",
  DRAFT: "secondary",
  CLOSED: "outline",
};

export function JobRow({ job }: { job: Job }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
      <div className="min-w-0">
        <Link href={PATH.RECRUITER_JOB_APPLICATIONS(job.id)} className="font-medium hover:underline">
          {job.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
          <span className="text-muted-foreground text-xs">{job.viewCount} lượt xem</span>
          <span className="text-muted-foreground text-xs">Đăng {formatRelativeDate(job.createdAt)}</span>
        </div>
      </div>
      <JobRowActions job={job} />
    </div>
  );
}
