import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyConversations } from "@/lib/services/chat.service";
import { getInterviewsForApplication } from "@/lib/services/interview.service";
import { getMyApplications } from "@/lib/services/job-application.service";
import { getJobById } from "@/lib/services/job.service";
import type { Interview } from "@/lib/types/interview";
import type { Job } from "@/lib/types/job";
import type { JobApplication } from "@/lib/types/job-application";
import { formatRelativeDate } from "@/lib/utils";
import { InterviewInfo } from "./interview-info";
import { WithdrawButton } from "./withdraw-button";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const [applications, { items: conversations }] = await Promise.all([
    getMyApplications(),
    getMyConversations(),
  ]);
  // The application list doesn't embed job details (API guide note #5) —
  // resolve each job separately.
  const [jobsById, interviewByApplicationId] = await Promise.all([
    resolveJobs(applications),
    resolveInterviews(applications),
  ]);
  const conversationIdByApplicationId = new Map(conversations.map((c) => [c.applicationId, c.id]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Đơn ứng tuyển của tôi</h1>
      <div className="space-y-4">
        {applications.map((application) => {
          const job = jobsById.get(application.jobId);
          const interview = interviewByApplicationId.get(application.id);

          return (
            <div key={application.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
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
                <div className="flex shrink-0 items-center gap-2">
                  {application.status === "PENDING" && <WithdrawButton applicationId={application.id} />}
                  {conversationIdByApplicationId.has(application.id) && (
                    <Link
                      href={`${PATH.MESSAGES}?conversationId=${conversationIdByApplicationId.get(application.id)}`}
                    >
                      <Button size="sm" variant="outline">
                        Nhắn tin
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              {interview && <InterviewInfo interview={interview} />}
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

// Interviews only ever exist for ACCEPTED applications — skip the rest.
async function resolveInterviews(applications: JobApplication[]): Promise<Map<string, Interview>> {
  const acceptedIds = applications.filter((a) => a.status === "ACCEPTED").map((a) => a.id);
  const lists = await Promise.all(
    acceptedIds.map((id) => getInterviewsForApplication(id).catch(() => [] as Interview[])),
  );
  const entries = acceptedIds
    .map((id, index) => [id, lists[index].find((interview) => interview.status !== "CANCELLED")] as const)
    .filter((entry): entry is [string, Interview] => Boolean(entry[1]));
  return new Map(entries);
}
