import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/shared/back-link";
import { EmptyState } from "@/components/shared/empty-state";
import { ApiError } from "@/lib/api";
import { APPLICATION_STATUS_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
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
import { canScheduleInterview, mayHaveInterview } from "@/lib/utils/application-interview";
import { applicationAnchorId } from "@/lib/utils/application-pipeline";
import { InterviewInfo } from "@/components/shared/interview-info";
import { DownloadCvButton } from "@/app/(main)/cv/cv-actions";
import { ApplicationHistory } from "@/app/(main)/applications/application-history";
import { ApplicationActions } from "./application-actions";
import { ApplicationBoard } from "./application-board";
import { ApplicationNotes } from "./application-notes";
import { StarToggle } from "./star-toggle";
import { InterviewPanel } from "./interview-panel";
import { JobStatsPanel } from "./job-stats-panel";

// The interview panel (with its buttons) while an interview can still be
// scheduled; once hired the backend refuses every interview action, so an
// existing interview is shown as history only — no buttons that would just fail.
function InterviewSection({
  application,
  interview,
}: {
  application: JobApplication;
  interview?: Interview;
}) {
  if (canScheduleInterview(application.status)) {
    return <InterviewPanel applicationId={application.id} interview={interview} />;
  }
  if (application.status === "HIRED" && interview) {
    return <InterviewInfo interview={interview} />;
  }
  return null;
}

async function resolveInterviews(applications: JobApplication[]): Promise<Map<string, Interview>> {
  // Only the stages where an interview is scheduled (plus HIRED, for history)
  // can have one — no need to ask about the rest.
  const candidateIds = applications.filter((a) => mayHaveInterview(a.status)).map((a) => a.id);
  const lists = await Promise.all(candidateIds.map((id) => getInterviewsOrEmpty(id)));
  const entries = candidateIds
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

// Switches between the detailed list and the pipeline board. Plain links, so the
// choice lives in the URL: shareable, and the back button works.
function ViewToggle({ jobId, isBoard }: { jobId: string; isBoard: boolean }) {
  const base = PATH.RECRUITER_JOB_APPLICATIONS(jobId);
  const link = "rounded-full px-3 py-1 text-sm font-medium transition-colors";
  const active = "bg-primary text-primary-foreground";
  const idle = "text-foreground/70 hover:bg-muted";

  return (
    <nav aria-label="Chế độ xem" className="bg-background flex gap-1 rounded-full border p-1">
      <Link
        href={base}
        aria-current={isBoard ? undefined : "page"}
        className={`${link} ${isBoard ? idle : active}`}
      >
        Danh sách
      </Link>
      <Link
        href={`${base}?view=board`}
        aria-current={isBoard ? "page" : undefined}
        className={`${link} ${isBoard ? active : idle}`}
      >
        Bảng
      </Link>
    </nav>
  );
}

// Role check lives in recruiter/layout.tsx.
export default async function RecruiterJobApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { jobId } = await params;
  // "list" (default) is the detailed view; "board" is the pipeline overview.
  const isBoard = (await searchParams).view === "board";
  // The backend rejects this for non-owners (403) — surfaced via the route's
  // error boundary, same as every other data-loading page in this app.
  const [job, applications, stats] = await Promise.all([
    getJobById(jobId),
    getApplicationsForJob(jobId),
    getApplicationStats(jobId),
  ]);
  // Interviews and histories are per-application requests, and only the list
  // view shows them — the board skips them. Interviews are only fetched for the
  // stages that can have one (see mayHaveInterview).
  const [interviewByApplicationId, historyByApplicationId] = isBoard
    ? [new Map<string, Interview>(), new Map<string, ApplicationStatusHistoryEntry[]>()]
    : await Promise.all([resolveInterviews(applications), resolveHistories(applications)]);

  return (
    <div>
      <div className="bg-primary/5 border-b py-8">
        <div className={`mx-auto px-4 ${isBoard ? "max-w-6xl" : "max-w-3xl"}`}>
          <BackLink href={PATH.RECRUITER_JOBS} label="Quay lại danh sách tin" />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">Ứng viên</h1>
              <p className="text-muted-foreground mt-1 text-sm">{job.title}</p>
            </div>
            <ViewToggle jobId={jobId} isBoard={isBoard} />
          </div>
        </div>
      </div>
      {/* The board needs the room for its columns; the list reads better narrow. */}
      <div className={`mx-auto px-4 py-8 ${isBoard ? "max-w-6xl" : "max-w-3xl"}`}>
        <JobStatsPanel stats={stats} />

        {applications.length === 0 ? (
          <EmptyState icon={Users} title="Chưa có ứng viên nào cho tin tuyển dụng này" />
        ) : isBoard ? (
          <ApplicationBoard applications={applications} />
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                id={applicationAnchorId(application.id)}
                className="border-border scroll-mt-24 rounded-xl border p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      {application.candidate?.avatarUrl && (
                        <AvatarImage
                          src={application.candidate.avatarUrl}
                          alt={application.candidate.fullName}
                        />
                      )}
                      <AvatarFallback>{initials(application.candidate?.fullName ?? "?")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-medium">{application.candidate?.fullName ?? "Ứng viên"}</p>
                        <StarToggle
                          applicationId={application.id}
                          starred={application.isStarred ?? false}
                          candidateName={application.candidate?.fullName ?? "ứng viên"}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          variant={application.status === "APPLIED" ? "secondary" : "outline"}
                          className="rounded-full"
                        >
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
                <InterviewSection
                  application={application}
                  interview={interviewByApplicationId.get(application.id)}
                />
                <ApplicationHistory history={historyByApplicationId.get(application.id) ?? []} />
                <ApplicationNotes applicationId={application.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
