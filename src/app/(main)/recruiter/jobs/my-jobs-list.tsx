"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePushParams } from "@/hooks/use-url-filter";
import { JOB_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { ListMeta } from "@/lib/types/common";
import type { Job, JobStatus } from "@/lib/types/job";
import { JobRow } from "./job-row";

const ALL = "all";
const STATUSES = Object.keys(JOB_STATUS_LABEL) as JobStatus[];

interface MyJobsListProps {
  items: Job[];
  meta?: ListMeta;
  initialStatus: string;
}

export function MyJobsList({ items, meta, initialStatus }: MyJobsListProps) {
  const { pushParams } = usePushParams();

  const page = meta?.page ?? 1;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="space-y-6">
      <Tabs
        value={initialStatus || ALL}
        onValueChange={(value) => pushParams({ status: value === ALL ? undefined : value, page: undefined })}
      >
        <TabsList>
          <TabsTrigger value={ALL}>Tất cả</TabsTrigger>
          {STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {JOB_STATUS_LABEL[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {items.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
        {items.length === 0 && !initialStatus && (
          <EmptyState
            icon={Briefcase}
            title="Chưa có tin tuyển dụng nào"
            description="Đăng tin tuyển dụng đầu tiên để bắt đầu tiếp cận ứng viên."
            action={
              <Button asChild variant="cta">
                <Link href={PATH.RECRUITER_JOB_NEW}>Đăng tin tuyển dụng</Link>
              </Button>
            }
          />
        )}
        {items.length === 0 && initialStatus && (
          <EmptyState icon={Briefcase} title="Chưa có tin tuyển dụng nào ở trạng thái này" />
        )}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={(next) => pushParams({ page: String(next) })}
      />
    </div>
  );
}
