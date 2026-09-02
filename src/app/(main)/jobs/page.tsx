import { JobsList } from "@/app/(main)/jobs/jobs-list";
import { getCategories } from "@/lib/services/category.service";
import { getJobs } from "@/lib/services/job.service";
import type { JobLevel, JobType } from "@/lib/types/job";

interface JobsPageProps {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
    location?: string;
    jobType?: string;
    level?: string;
    categoryId?: string;
  }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  // Two independent data sources for this route — fetched in parallel
  // instead of awaited one after another.
  const [{ items, meta }, categories] = await Promise.all([
    getJobs({
      page,
      keyword: sp.keyword,
      location: sp.location,
      jobType: sp.jobType as JobType | undefined,
      level: sp.level as JobLevel | undefined,
      categoryId: sp.categoryId,
    }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Việc làm</h1>
      <JobsList
        items={items}
        meta={meta}
        categories={categories}
        initialKeyword={sp.keyword ?? ""}
        initialLocation={sp.location ?? ""}
        initialJobType={sp.jobType ?? ""}
        initialLevel={sp.level ?? ""}
        initialCategoryId={sp.categoryId ?? ""}
      />
    </div>
  );
}
