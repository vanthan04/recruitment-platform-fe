import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyJobs } from "@/lib/services/job.service";
import type { JobStatus } from "@/lib/types/job";
import { MyJobsList } from "./my-jobs-list";

interface RecruiterJobsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function RecruiterJobsPage({ searchParams }: RecruiterJobsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "RECRUITER") redirect(PATH.JOBS);

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, meta } = await getMyJobs({ status: sp.status as JobStatus | undefined, page });

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
