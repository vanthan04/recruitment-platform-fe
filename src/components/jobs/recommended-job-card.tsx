import Link from "next/link";
import { Banknote, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/companies/company-logo";
import { EMPLOYMENT_TYPE_LABEL, WORK_MODE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import type { RecommendedJob } from "@/lib/types/job-recommendation";
import { formatSalaryRange } from "@/lib/utils";

/**
 * A recommended job, showing *why* it was recommended: how many of the job's
 * skills the candidate has, which ones, and which are missing. The ranking
 * itself is the backend's (it orders by coverage, smoothed so a job asking
 * for a single skill can't top every list).
 */
export function RecommendedJobCard({ recommendation }: { recommendation: RecommendedJob }) {
  const { job, matchedSkills, missingSkills } = recommendation;
  const total = matchedSkills.length + missingSkills.length;

  return (
    <Card className="border-border hover:border-primary/50 rounded-xl shadow-sm transition-colors">
      <CardHeader className="flex flex-row items-start gap-3">
        <CompanyLogo
          name={job.company.name}
          logoUrl={job.company.logoUrl}
          className="size-12 rounded-xl text-base"
        />
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-base">
            <Link href={PATH.JOB_DETAIL(job.id)} className="hover:text-primary transition-colors">
              {job.title}
            </Link>
          </CardTitle>
          <p className="text-muted-foreground truncate text-sm">{job.company.name}</p>
        </div>
        <Badge
          className="shrink-0 rounded-full"
          aria-label={`Khớp ${matchedSkills.length} trên ${total} kỹ năng`}
        >
          Khớp {matchedSkills.length}/{total} kỹ năng
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Banknote className="size-3.5" />
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          <span>
            {WORK_MODE_LABEL[job.workMode]} · {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">Kỹ năng bạn có</p>
          <ul className="flex flex-wrap gap-1.5" aria-label="Kỹ năng bạn có">
            {matchedSkills.map((skill) => (
              <li key={skill}>
                <Badge variant="secondary" className="bg-primary/10 text-primary rounded-full">
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        {missingSkills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">Còn thiếu</p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Kỹ năng còn thiếu">
              {missingSkills.map((skill) => (
                <li key={skill}>
                  <Badge variant="outline" className="text-muted-foreground rounded-full">
                    {skill}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
