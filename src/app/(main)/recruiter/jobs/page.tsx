import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { getMyJobs } from "@/lib/services/job.service";
import type { JobStatus } from "@/lib/types/job";
import { parseEnumParam } from "@/lib/utils";
import { MyJobsList } from "./my-jobs-list";

interface RecruiterJobsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

// Role check lives in recruiter/layout.tsx.
export default async function RecruiterJobsPage({ searchParams }: RecruiterJobsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const status = parseEnumParam<JobStatus>(sp.status, Object.keys(JOB_STATUS_LABEL) as JobStatus[]);
  const { items, meta } = await getMyJobs({ status, page });

  return (
    <div>
      <div className="bg-primary/5 border-b py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Tin tuyển dụng của tôi</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {(meta?.total ?? items.length).toLocaleString("vi-VN")} tin đang quản lý
            </p>
          </div>
          <Link href={PATH.RECRUITER_JOB_NEW}>
            <Button className="rounded-full">Đăng tin mới</Button>
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <MyJobsList items={items} meta={meta} initialStatus={sp.status ?? ""} />
      </div>
    </div>
  );
}
