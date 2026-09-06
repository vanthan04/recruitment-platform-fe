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
      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl shadow-sm ring-1">
        <div className="from-primary/20 via-primary/5 h-20 bg-gradient-to-r to-transparent" />
        <div className="flex items-start gap-4 px-5 pb-5">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logoUrl}
            className="ring-card -mt-8 size-16 rounded-xl ring-4"
          />
          <div className="mt-1.5 min-w-0">
            <h1 className="text-xl font-semibold">{company.name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {company.companyType && (
                <Badge className="rounded-full">{COMPANY_TYPE_LABEL[company.companyType]}</Badge>
              )}
              {company.size && (
                <Badge variant="secondary" className="rounded-full">
                  {COMPANY_SIZE_LABEL[company.size]}
                </Badge>
              )}
              {company.address && (
                <Badge variant="outline" className="rounded-full">
                  {company.address}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {(company.description || company.website) && (
        <div className="bg-card ring-foreground/10 space-y-4 rounded-xl p-5 shadow-sm ring-1">
          {company.description && (
            <div>
              <h2 className="mb-1.5 text-sm font-semibold">Giới thiệu công ty</h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {company.description}
              </p>
            </div>
          )}
          {company.website && (
            <div className="text-sm">
              <span className="text-muted-foreground">Website: </span>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {company.website}
              </a>
            </div>
          )}
        </div>
      )}

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
