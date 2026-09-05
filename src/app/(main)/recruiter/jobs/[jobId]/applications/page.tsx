import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import {
  getApplicationHistory,
  getApplicationsForJob,
  getApplicationStats,
} from "@/lib/services/job-application.service";
import { getJobById } from "@/lib/services/job.service";
import { getInterviewsForApplication } from "@/lib/services/interview.service";
import type { Interview } from "@/lib/types/interview";
import type { ApplicationStatusHistoryEntry, JobApplication } from "@/lib/types/job-application";
import { formatRelativeDate } from "@/lib/utils";
import { DownloadCvButton } from "@/app/(main)/cv/cv-actions";
import { ApplicationHistory } from "@/app/(main)/applications/application-history";
import { ApplicationActions } from "./application-actions";
import { InterviewPanel } from "./interview-panel";
import { JobStatsPanel } from "./job-stats-panel";

async function resolveInterviews(applications: JobApplication[]): Promise<Map<string, Interview>> {
  const hiredIds = applications.filter((a) => a.status === "HIRED").map((a) => a.id);
  const lists = await Promise.all(hiredIds.map((id) => getInterviewsOrEmpty(id)));
  const entries = hiredIds
    .map((id, index) => [id, lists[index].find((interview) => interview.status !== "CANCELLED")] as const)
    .filter((entry): entry is [string, Interview] => Boolean(entry[1]));
  return new Map(entries);
}

async function getInterviewsOrEmpty(applicationId: string): Promise<Interview[]> {
  try {
    return await getInterviewsForApplication(applicationId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

async function resolveHistories(
  applications: JobApplication[],
): Promise<Map<string, ApplicationStatusHistoryEntry[]>> {
  const histories = await Promise.all(applications.map((a) => getApplicationHistory(a.id)));
  return new Map(applications.map((a, index) => [a.id, histories[index]]));
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// Role check lives in recruiter/layout.tsx.
export default async function RecruiterJobApplicationsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  // The backend rejects this for non-owners (403) — surfaced via the route's
  // error boundary, same as every other data-loading page in this app.
  const [job, applications, stats] = await Promise.all([
    getJobById(jobId),
    getApplicationsForJob(jobId),
    getApplicationStats(jobId),
  ]);
  // Interviews only make sense once an application is ACCEPTED — skip the
  // extra round trips for the rest.
  const [interviewByApplicationId, historyByApplicationId] = await Promise.all([
    resolveInterviews(applications),
    resolveHistories(applications),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Ứng viên</h1>
      <p className="text-muted-foreground mb-6 text-sm">{job.title}</p>

      <JobStatsPanel stats={stats} />

      <div className="space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Avatar>
                  {application.candidate?.avatarUrl && (
                    <AvatarImage src={application.candidate.avatarUrl} alt={application.candidate.fullName} />
                  )}
                  <AvatarFallback>{initials(application.candidate?.fullName ?? "?")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{application.candidate?.fullName ?? "Ứng viên"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={application.status === "APPLIED" ? "secondary" : "outline"}>
                      {APPLICATION_STATUS_LABEL[application.status]}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      Ứng tuyển {formatRelativeDate(application.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DownloadCvButton cvId={application.cvId} />
                <ApplicationActions application={application} />
              </div>
            </div>
            {application.status === "HIRED" && (
              <InterviewPanel
                applicationId={application.id}
                interview={interviewByApplicationId.get(application.id)}
              />
            )}
            <ApplicationHistory history={historyByApplicationId.get(application.id) ?? []} />
          </div>
        ))}
        {applications.length === 0 && (
          <p className="text-muted-foreground text-sm">Chưa có ứng viên nào cho tin tuyển dụng này.</p>
        )}
      </div>
    </div>
  );
}
