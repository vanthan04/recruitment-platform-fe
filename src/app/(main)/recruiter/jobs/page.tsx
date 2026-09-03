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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tin tuyển dụng của tôi</h1>
        <Link href={PATH.RECRUITER_JOB_NEW}>
          <Button>Đăng tin mới</Button>
        </Link>
      </div>
      <MyJobsList items={items} meta={meta} initialStatus={sp.status ?? ""} />
    </div>
  );
}
