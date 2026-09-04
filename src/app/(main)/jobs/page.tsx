import { JobsList } from "@/app/(main)/jobs/jobs-list";
import { getMyBookmarkedJobIds } from "@/lib/services/bookmark.service";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { getJobs } from "@/lib/services/job.service";
import { JOB_LEVEL_LABEL, JOB_SORT_LABEL, JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import type { JobLevel, JobSortOption, JobType } from "@/lib/types/job";
import { parseEnumParam } from "@/lib/utils";

interface JobsPageProps {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
    location?: string;
    jobType?: string;
    level?: string;
    categoryId?: string;
    sort?: string;
  }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  // Independent data sources for this route — fetched in parallel instead
  // of awaited one after another.
  const [{ items, meta }, categories, user] = await Promise.all([
    getJobs({
      page,
      keyword: sp.keyword,
      location: sp.location,
      jobType: parseEnumParam<JobType>(sp.jobType, Object.keys(JOB_TYPE_LABEL) as JobType[]),
      level: parseEnumParam<JobLevel>(sp.level, Object.keys(JOB_LEVEL_LABEL) as JobLevel[]),
      categoryId: sp.categoryId,
      sort: parseEnumParam<JobSortOption>(sp.sort, Object.keys(JOB_SORT_LABEL) as JobSortOption[]),
    }),
    getCategories(),
    getCurrentUser(),
  ]);

  const bookmarkedJobIds = user ? await getMyBookmarkedJobIds() : undefined;

  return (
    <div>
      <div className="bg-primary/5 border-b py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-semibold sm:text-3xl">Việc làm</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {(meta?.total ?? items.length).toLocaleString("vi-VN")} tin tuyển dụng đang chờ bạn khám phá
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <JobsList
          items={items}
          meta={meta}
          categories={categories}
          bookmarkedJobIds={bookmarkedJobIds}
          initialKeyword={sp.keyword ?? ""}
          initialLocation={sp.location ?? ""}
          initialJobType={sp.jobType ?? ""}
          initialLevel={sp.level ?? ""}
          initialCategoryId={sp.categoryId ?? ""}
          initialSort={sp.sort ?? ""}
          isCandidate={user?.role === "CANDIDATE"}
        />
      </div>
    </div>
  );
}
