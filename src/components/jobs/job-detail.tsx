import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApplyDialog } from "@/components/jobs/apply-dialog";
import { CompanyLogo } from "@/components/companies/company-logo";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ShareJobButtons } from "@/components/jobs/share-job-buttons";
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Cv } from "@/lib/types/cv";
import { JOB_EXTRA_INFO_KEY, type Job } from "@/lib/types/job";
import { formatDate, formatRelativeDate, formatSalaryRange } from "@/lib/utils";

interface JobDetailProps {
  job: Job;
  isLoggedIn: boolean;
  isBookmarked?: boolean;
  publishedCvs?: Cv[];
  hasApplied?: boolean;
}

export function JobDetail({ job, isLoggedIn, isBookmarked, publishedCvs, hasApplied }: JobDetailProps) {
  return (
    // Container query, not a viewport breakpoint — this component also
    // renders inside a fixed-width dialog (JobModal), where a viewport-based
    // `lg:` class would wrongly trigger the 3-column layout on a wide screen.
    <div className="@container grid gap-6 @3xl:grid-cols-3">
      <div className="bg-card ring-foreground/10 rounded-2xl p-5 shadow-sm ring-1 sm:p-6 @3xl:col-span-2">
        <div className="flex items-start gap-4">
          <CompanyLogo
            name={job.company?.name ?? "?"}
            logoUrl={job.company?.logoUrl ?? null}
            className="size-14 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">{job.title}</h1>
            {job.company ? (
              <Link
                href={PATH.COMPANY_DETAIL(job.company.id)}
                className="text-primary text-sm hover:underline"
              >
                {job.company.name}
              </Link>
            ) : (
              <p className="text-muted-foreground text-sm">Công ty ẩn danh</p>
            )}
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
              <MapPin className="size-3.5 shrink-0" />
              {job.location}
            </p>
          </div>
          {isLoggedIn && <SaveJobButton jobId={job.id} initialBookmarked={isBookmarked} />}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {JOB_TYPE_LABEL[job.jobType]}
          </Badge>
          {job.level && (
            <Badge variant="secondary" className="rounded-full">
              {JOB_LEVEL_LABEL[job.level]}
            </Badge>
          )}
          {job.category && (
            <Badge variant="outline" className="rounded-full">
              {job.category.name}
            </Badge>
          )}
        </div>

        <Separator className="my-5" />

        <div className="space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="mb-1 font-semibold">Mô tả công việc</h2>
            <p className="whitespace-pre-line">{job.description}</p>
          </section>
          {job.requirements && (
            <section>
              <h2 className="mb-1 font-semibold">Yêu cầu ứng viên</h2>
              <p className="whitespace-pre-line">{job.requirements}</p>
            </section>
          )}
          {job.benefits && (
            <section>
              <h2 className="mb-1 font-semibold">Quyền lợi</h2>
              <p className="whitespace-pre-line">{job.benefits}</p>
            </section>
          )}
          {job.extraInfo?.[JOB_EXTRA_INFO_KEY.WORKING_HOURS] && (
            <section>
              <h2 className="mb-1 font-semibold">Thời gian làm việc</h2>
              <p className="whitespace-pre-line">{job.extraInfo[JOB_EXTRA_INFO_KEY.WORKING_HOURS]}</p>
            </section>
          )}
          {job.extraInfo?.[JOB_EXTRA_INFO_KEY.APPLICATION_METHOD] && (
            <section>
              <h2 className="mb-1 font-semibold">Cách thức ứng tuyển</h2>
              <p className="whitespace-pre-line">{job.extraInfo[JOB_EXTRA_INFO_KEY.APPLICATION_METHOD]}</p>
            </section>
          )}
        </div>
      </div>

      <div className="space-y-4 @3xl:sticky @3xl:top-20 @3xl:h-fit">
        <div className="bg-card ring-foreground/10 rounded-2xl p-5 shadow-sm ring-1">
          <p className="text-muted-foreground text-xs">Mức lương</p>
          <p className="text-primary text-xl font-bold">
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">Đăng {formatRelativeDate(job.createdAt)}</p>
          {job.expiresAt && (
            <p className="text-muted-foreground mt-1 text-xs">Hạn ứng tuyển: {formatDate(job.expiresAt)}</p>
          )}
          <div className="mt-4">
            <ApplyCta
              isLoggedIn={isLoggedIn}
              publishedCvs={publishedCvs}
              hasApplied={hasApplied}
              jobId={job.id}
            />
          </div>
          <Separator className="my-4" />
          <ShareJobButtons jobId={job.id} />
        </div>

        {job.company && (
          <div className="bg-card ring-foreground/10 rounded-2xl p-5 shadow-sm ring-1">
            <p className="text-muted-foreground mb-3 text-xs font-medium">Về công ty</p>
            <div className="flex items-center gap-3">
              <CompanyLogo
                name={job.company.name}
                logoUrl={job.company.logoUrl}
                className="size-12 rounded-xl"
              />
              <div className="min-w-0">
                <p className="line-clamp-1 font-medium">{job.company.name}</p>
                <Link
                  href={PATH.COMPANY_DETAIL(job.company.id)}
                  className="text-primary text-xs font-medium hover:underline"
                >
                  Xem trang công ty
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplyCta({
  isLoggedIn,
  publishedCvs,
  hasApplied,
  jobId,
}: {
  isLoggedIn: boolean;
  publishedCvs?: Cv[];
  hasApplied?: boolean;
  jobId: string;
}) {
  if (!isLoggedIn) {
    return (
      <Button asChild className="w-full">
        <Link href={PATH.LOGIN}>Ứng tuyển ngay</Link>
      </Button>
    );
  }

  if (hasApplied) {
    return (
      <Button className="w-full" disabled>
        Đã ứng tuyển
      </Button>
    );
  }

  if (!publishedCvs || publishedCvs.length === 0) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={PATH.CV_LIST}>Tạo và xuất bản CV để ứng tuyển</Link>
      </Button>
    );
  }

  return <ApplyDialog jobId={jobId} cvs={publishedCvs} />;
}
