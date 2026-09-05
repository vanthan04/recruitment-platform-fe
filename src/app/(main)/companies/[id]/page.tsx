import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { CompanyLogo } from "@/components/companies/company-logo";
import { JobCard } from "@/components/jobs/job-card";
import { Badge } from "@/components/ui/badge";
import { COMPANY_SIZE_LABEL, COMPANY_TYPE_LABEL } from "@/lib/constants/enum-label";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyBookmarkedJobIds } from "@/lib/services/bookmark.service";
import { getCompanyById } from "@/lib/services/company.service";
import { getJobs } from "@/lib/services/job.service";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = await params;
  // Company and its open jobs are two independent resources/services (see
  // MICROSERVICES_MIGRATION_PLAN.md — the dependency only ever runs
  // Jobs -> Companies, never the reverse), composed here on the page rather
  // than the backend bundling job data into the company response.
  const [company, user, { items: openJobs }] = await Promise.all([
    fetchCompanyOr404(id),
    getCurrentUser(),
    getJobs({ companyId: id, limit: 50 }),
  ]);
  const bookmarkedJobIds = user ? await getMyBookmarkedJobIds() : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-start gap-4">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} className="size-16" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{company.name}</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            {company.companyType && <Badge>{COMPANY_TYPE_LABEL[company.companyType]}</Badge>}
            {company.size && <Badge variant="outline">{COMPANY_SIZE_LABEL[company.size]}</Badge>}
          </div>
        </div>
      </div>

      {company.description && (
        <p className="text-sm leading-relaxed whitespace-pre-line">{company.description}</p>
      )}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {company.address && (
          <div>
            <dt className="text-muted-foreground">Địa chỉ</dt>
            <dd>{company.address}</dd>
          </div>
        )}
        {company.website && (
          <div>
            <dt className="text-muted-foreground">Website</dt>
            <dd>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Việc làm đang tuyển ({openJobs.length})</h2>
        {openJobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {openJobs.map((job) => (
              <JobCard key={job.id} job={job} bookmarkedJobIds={bookmarkedJobIds} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Công ty hiện chưa có tin tuyển dụng nào.</p>
        )}
      </div>
    </div>
  );
}

async function fetchCompanyOr404(id: string) {
  try {
    return await getCompanyById(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
