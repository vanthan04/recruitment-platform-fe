"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JOB_STATUS_LABEL } from "@/lib/constants/enum-label";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

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
        {items.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            Chưa có tin tuyển dụng nào ở trạng thái này.
          </p>
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
