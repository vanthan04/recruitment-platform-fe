import Link from "next/link";
import { Award, Briefcase, Laptop, MapPin, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApplyDialog } from "@/components/jobs/apply-dialog";
import { CompanyLogo } from "@/components/companies/company-logo";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { ShareJobButtons } from "@/components/jobs/share-job-buttons";
import { EMPLOYMENT_TYPE_LABEL, JOB_LEVEL_LABEL, WORK_MODE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Cv } from "@/lib/types/cv";
import type { Job } from "@/lib/types/job";
import { formatDate, formatRelativeDate, formatSalaryRange } from "@/lib/utils";

interface JobDetailProps {
  job: Job;
  isLoggedIn: boolean;
  isCandidate?: boolean;
  isBookmarked?: boolean;
  publishedCvs?: Cv[];
  hasApplied?: boolean;
}

export function JobDetail({
  job,
  isLoggedIn,
  isCandidate,
  isBookmarked,
  publishedCvs,
  hasApplied,
}: JobDetailProps) {
  return (
    // Container query, not a viewport breakpoint — this component also
    // renders inside a fixed-width dialog (JobModal), where a viewport-based
    // `lg:` class would wrongly trigger the 3-column layout on a wide screen.
    <div className="@container grid gap-6 @3xl:grid-cols-3">
      <div className="bg-card ring-foreground/10 rounded-xl p-5 shadow-sm ring-1 sm:p-6 @3xl:col-span-2">
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

        <Separator className="my-4" />

        <section>
          <h2 className="border-primary mb-3 border-l-4 pl-2.5 font-semibold">Tổng quan</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Hình thức:</span>
              <Badge variant="secondary" className="rounded-full">
                {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {WORK_MODE_LABEL[job.workMode]}
              </Badge>
              {job.level && (
                <Badge variant="secondary" className="rounded-full">
                  {JOB_LEVEL_LABEL[job.level]}
                </Badge>
              )}
            </div>
            {(job.category || job.skills.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground w-28 shrink-0">Chuyên môn:</span>
                {job.category && (
                  <Badge variant="outline" className="rounded-full">
                    {job.category.name}
                  </Badge>
                )}
                {job.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" className="rounded-full">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        <Separator className="my-5" />

        <div className="space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="border-primary mb-1.5 border-l-4 pl-2.5 font-semibold">Mô tả công việc</h2>
            <p className="whitespace-pre-line">{job.description}</p>
          </section>
          {job.requirements.length > 0 && (
            <section>
              <h2 className="border-primary mb-1.5 border-l-4 pl-2.5 font-semibold">Yêu cầu ứng viên</h2>
              <ul className="list-disc space-y-1 pl-5">
                {job.requirements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {job.benefits.length > 0 && (
            <section>
              <h2 className="border-primary mb-1.5 border-l-4 pl-2.5 font-semibold">Quyền lợi</h2>
              <ul className="list-disc space-y-1 pl-5">
                {job.benefits.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {(job.address || job.workingHours.length > 0) && (
            <section>
              <h2 className="border-primary mb-1.5 border-l-4 pl-2.5 font-semibold">Địa điểm và thời gian</h2>
              <div className="space-y-3">
                {job.address && (
                  <div>
                    <p className="mb-1 font-medium">Địa điểm làm việc</p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">{job.location}:</span> {job.address}
                    </p>
                  </div>
                )}
                {job.workingHours.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium">Thời gian làm việc</p>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5">
                      {job.workingHours.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="space-y-4 @3xl:sticky @3xl:top-20 @3xl:h-fit">
        <div className="bg-card ring-foreground/10 rounded-xl p-5 shadow-sm ring-1">
          <p className="text-muted-foreground text-xs">Mức lương</p>
          <p className="text-primary bg-primary/10 mt-1 inline-block rounded-md px-2 py-1 text-xl font-bold">
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">Đăng {formatRelativeDate(job.createdAt)}</p>
          {job.expiresAt && (
            <p className="text-muted-foreground mt-1 text-xs">Hạn ứng tuyển: {formatDate(job.expiresAt)}</p>
          )}
          <div className="mt-4">
            <ApplyCta
              isLoggedIn={isLoggedIn}
              isCandidate={isCandidate}
              publishedCvs={publishedCvs}
              hasApplied={hasApplied}
              jobId={job.id}
            />
          </div>
          <Separator className="my-4" />
          <ShareJobButtons jobId={job.id} />
        </div>

        <div className="bg-card ring-foreground/10 space-y-3 rounded-xl p-5 shadow-sm ring-1">
          <p className="text-muted-foreground text-xs font-medium">Thông tin chung</p>
          <InfoRow icon={Briefcase} label="Loại hình" value={EMPLOYMENT_TYPE_LABEL[job.employmentType]} />
          <InfoRow icon={Laptop} label="Hình thức làm việc" value={WORK_MODE_LABEL[job.workMode]} />
          {job.level && <InfoRow icon={Award} label="Cấp bậc" value={JOB_LEVEL_LABEL[job.level]} />}
        </div>

        {job.company && (
          <div className="bg-card ring-foreground/10 rounded-xl p-5 shadow-sm ring-1">
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
  isCandidate,
  publishedCvs,
  hasApplied,
  jobId,
}: {
  isLoggedIn: boolean;
  isCandidate?: boolean;
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

  // Applying is candidate-only — recruiters/admins viewing a job (e.g. to
  // check how it looks live) get no apply CTA at all.
  if (!isCandidate) {
    return null;
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

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  );
}
