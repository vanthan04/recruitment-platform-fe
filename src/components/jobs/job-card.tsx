import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/companies/company-logo";
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Job } from "@/lib/types/job";
import { formatRelativeDate, formatSalaryRange } from "@/lib/utils";

export function JobCard({ job }: { job: Job }) {
  return (
    <Card className="hover:border-primary transition-colors">
      <Link href={PATH.JOB_DETAIL(job.id)} scroll={false} className="block">
        <CardHeader className="flex flex-row items-start gap-3">
          <CompanyLogo name={job.company?.name ?? "?"} logoUrl={job.company?.logoUrl ?? null} />
          <div className="min-w-0">
            <CardTitle className="line-clamp-1">{job.title}</CardTitle>
            <p className="text-muted-foreground truncate text-sm">
              {job.company?.name ?? "Công ty ẩn danh"} — {job.location}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{JOB_TYPE_LABEL[job.jobType]}</Badge>
          {job.level && <Badge variant="secondary">{JOB_LEVEL_LABEL[job.level]}</Badge>}
          {job.category && <Badge variant="outline">{job.category.name}</Badge>}
          <span className="text-primary ml-auto text-sm font-medium">
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          <span className="text-muted-foreground w-full text-xs">{formatRelativeDate(job.createdAt)}</span>
        </CardContent>
      </Link>
    </Card>
  );
}
