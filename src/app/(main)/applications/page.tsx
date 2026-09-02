import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyApplications } from "@/lib/services/job-application.service";
import { getJobById } from "@/lib/services/job.service";
import type { Job } from "@/lib/types/job";
import type { JobApplication } from "@/lib/types/job-application";
import { formatRelativeDate } from "@/lib/utils";
import { WithdrawButton } from "./withdraw-button";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const applications = await getMyApplications();
  // The application list doesn't embed job details (API guide note #5) —
  // resolve each job separately.
  const jobsById = await resolveJobs(applications);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Đơn ứng tuyển của tôi</h1>
      <div className="space-y-4">
        {applications.map((application) => {
          const job = jobsById.get(application.jobId);
          return (
            <div
              key={application.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div>
                {job ? (
                  <Link href={PATH.JOB_DETAIL(job.id)} className="font-medium hover:underline">
                    {job.title}
                  </Link>
                ) : (
                  <span className="font-medium">Tin tuyển dụng không còn tồn tại</span>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={application.status === "PENDING" ? "secondary" : "outline"}>
                    {APPLICATION_STATUS_LABEL[application.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    Nộp {formatRelativeDate(application.createdAt)}
                  </span>
                </div>
              </div>
              {application.status === "PENDING" && <WithdrawButton applicationId={application.id} />}
            </div>
          );
        })}
        {applications.length === 0 && (
          <p className="text-muted-foreground text-sm">Bạn chưa ứng tuyển việc làm nào.</p>
        )}
      </div>
    </div>
  );
}

async function resolveJobs(applications: JobApplication[]): Promise<Map<string, Job>> {
  const uniqueJobIds = [...new Set(applications.map((application) => application.jobId))];
  const jobs = await Promise.all(uniqueJobIds.map((jobId) => getJobById(jobId).catch(() => null)));
  return new Map(jobs.filter((job): job is Job => job !== null).map((job) => [job.id, job]));
}
