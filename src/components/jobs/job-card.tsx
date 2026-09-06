import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/companies/company-logo";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { EMPLOYMENT_TYPE_LABEL, JOB_LEVEL_LABEL, WORK_MODE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Job } from "@/lib/types/job";
import { daysUntil, formatRelativeDate, formatSalaryRange } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  // Only passed for logged-in users (undefined hides the save button rather
  // than showing an always-unbookmarked icon that would fail on click).
  bookmarkedJobIds?: Set<string>;
}

export function JobCard({ job, bookmarkedJobIds }: JobCardProps) {
  const daysLeft = job.expiresAt ? daysUntil(job.expiresAt) : null;

  return (
    <Card className="border-border hover:border-primary relative gap-3 rounded-xl shadow-sm transition-all hover:shadow-md">
      {bookmarkedJobIds && (
        <SaveJobButton
          jobId={job.id}
          initialBookmarked={bookmarkedJobIds.has(job.id)}
          className="absolute top-3 right-3 z-10"
        />
      )}
      <Link href={PATH.JOB_DETAIL(job.id)} scroll={false} className="block">
        <CardHeader className="flex flex-row items-start gap-3">
          <CompanyLogo
            name={job.company?.name ?? "?"}
            logoUrl={job.company?.logoUrl ?? null}
            className="size-12 rounded-xl"
          />
          <div className="min-w-0 pr-8">
            <CardTitle className="line-clamp-1 text-base">{job.title}</CardTitle>
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {job.company?.name ?? "Công ty ẩn danh"}
            </p>
            <p className="text-muted-foreground bg-muted mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-1.5">
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
          {job.category && (
            <Badge variant="outline" className="rounded-full">
              {job.category.name}
            </Badge>
          )}
          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && (
            <Badge className="rounded-full border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
              {daysLeft === 0 ? "Hết hạn hôm nay" : `Còn ${daysLeft} ngày`}
            </Badge>
          )}
        </CardContent>
        <CardContent className="border-border/70 flex items-center justify-between border-t pt-3">
          <span className="text-primary bg-primary/10 rounded-md px-2 py-1 text-sm font-semibold">
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          <span className="text-muted-foreground text-xs">{formatRelativeDate(job.createdAt)}</span>
        </CardContent>
      </Link>
    </Card>
  );
}
