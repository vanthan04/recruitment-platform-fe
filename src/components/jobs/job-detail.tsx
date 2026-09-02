import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CompanyLogo } from "@/components/companies/company-logo";
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { Job } from "@/lib/types/job";
import { formatRelativeDate, formatSalaryRange } from "@/lib/utils";

export function JobDetail({ job }: { job: Job }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <CompanyLogo
          name={job.company?.name ?? "?"}
          logoUrl={job.company?.logoUrl ?? null}
          className="size-12"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{job.title}</h1>
          {job.company ? (
            <Link href={PATH.COMPANY_DETAIL(job.company.id)} className="text-primary text-sm hover:underline">
              {job.company.name}
            </Link>
          ) : (
            <p className="text-muted-foreground text-sm">Công ty ẩn danh</p>
          )}
          <p className="text-muted-foreground text-sm">{job.location}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{JOB_TYPE_LABEL[job.jobType]}</Badge>
        {job.level && <Badge variant="secondary">{JOB_LEVEL_LABEL[job.level]}</Badge>}
        {job.category && <Badge variant="outline">{job.category.name}</Badge>}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-primary font-medium">
          {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
        </span>
        <span className="text-muted-foreground">Đăng {formatRelativeDate(job.createdAt)}</span>
      </div>

      <Button asChild className="w-full">
        <Link href={PATH.LOGIN}>Ứng tuyển ngay</Link>
      </Button>

      <Separator />

      <div className="space-y-4 text-sm leading-relaxed">
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
      </div>
    </div>
  );
}
