import { JobsList } from "@/app/(main)/jobs/jobs-list";
import { getMyBookmarkedJobIds } from "@/lib/services/bookmark.service";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { getJobs } from "@/lib/services/job.service";
import { getSkills } from "@/lib/services/skill.service";
import {
  EMPLOYMENT_TYPE_LABEL,
  JOB_LEVEL_LABEL,
  JOB_SORT_LABEL,
  WORK_MODE_LABEL,
} from "@/lib/constants/enum-label";
import type { EmploymentType, JobLevel, JobSortOption, WorkMode } from "@/lib/types/job";
import { parseEnumParam } from "@/lib/utils";

interface JobsPageProps {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
    location?: string;
    employmentType?: string;
    workMode?: string;
    level?: string;
    categoryId?: string;
    skillIds?: string;
    sort?: string;
  }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);

  // Independent data sources for this route — fetched in parallel instead
  // of awaited one after another.
  const skillIds = sp.skillIds ? sp.skillIds.split(",").filter(Boolean) : undefined;

  const [{ items, meta }, categories, skills, user] = await Promise.all([
    getJobs({
      page,
      keyword: sp.keyword,
      location: sp.location,
      employmentType: parseEnumParam<EmploymentType>(
        sp.employmentType,
        Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[],
      ),
      workMode: parseEnumParam<WorkMode>(sp.workMode, Object.keys(WORK_MODE_LABEL) as WorkMode[]),
      level: parseEnumParam<JobLevel>(sp.level, Object.keys(JOB_LEVEL_LABEL) as JobLevel[]),
      categoryId: sp.categoryId,
      skillIds,
      sort: parseEnumParam<JobSortOption>(sp.sort, Object.keys(JOB_SORT_LABEL) as JobSortOption[]),
    }),
    getCategories(),
    getSkills(),
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
          skills={skills}
          bookmarkedJobIds={bookmarkedJobIds}
          initialKeyword={sp.keyword ?? ""}
          initialLocation={sp.location ?? ""}
          initialEmploymentType={sp.employmentType ?? ""}
          initialWorkMode={sp.workMode ?? ""}
          initialLevel={sp.level ?? ""}
          initialCategoryId={sp.categoryId ?? ""}
          initialSkillIds={skillIds ?? []}
          initialSort={sp.sort ?? ""}
          isCandidate={user?.role === "CANDIDATE"}
        />
      </div>
    </div>
  );
}
