"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { JobCard } from "@/components/jobs/job-card";
import { SaveSearchButton } from "@/components/jobs/save-search-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  EMPLOYMENT_TYPE_LABEL,
  JOB_LEVEL_LABEL,
  JOB_SORT_LABEL,
  WORK_MODE_LABEL,
} from "@/lib/constants/enum-label";
import type { Category } from "@/lib/types/category";
import type { ListMeta } from "@/lib/types/common";
import type { EmploymentType, Job, JobLevel, JobSortOption, WorkMode } from "@/lib/types/job";
import type { Skill } from "@/lib/types/skill";
import { cn } from "@/lib/utils";

const ALL = "all";
const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[];
const WORK_MODES = Object.keys(WORK_MODE_LABEL) as WorkMode[];
const JOB_LEVELS = Object.keys(JOB_LEVEL_LABEL) as JobLevel[];
const JOB_SORTS = Object.keys(JOB_SORT_LABEL) as JobSortOption[];
const DEFAULT_SORT: JobSortOption = "newest";

interface JobsListProps {
  items: Job[];
  meta?: ListMeta;
  categories: Category[];
  skills: Skill[];
  bookmarkedJobIds?: Set<string>;
  initialKeyword: string;
  initialLocation: string;
  initialEmploymentType: string;
  initialWorkMode: string;
  initialLevel: string;
  initialCategoryId: string;
  initialSkillIds: string[];
  initialSort: string;
  isCandidate?: boolean;
}

export function JobsList({
  items,
  meta,
  categories,
  skills,
  bookmarkedJobIds,
  initialKeyword,
  initialLocation,
  initialEmploymentType,
  initialWorkMode,
  initialLevel,
  initialCategoryId,
  initialSkillIds,
  initialSort,
  isCandidate,
}: JobsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const debouncedKeyword = useDebouncedValue(keyword, 400);
  const debouncedLocation = useDebouncedValue(location, 400);

  // Search/filter/pagination all live in the URL, so a change simply
  // triggers a server re-render of page.tsx with new searchParams — no
  // client-side REST call is made here.
  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  useEffect(() => {
    if (debouncedKeyword === (searchParams.get("keyword") ?? "")) return;
    pushParams({ keyword: debouncedKeyword || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  useEffect(() => {
    if (debouncedLocation === (searchParams.get("location") ?? "")) return;
    pushParams({ location: debouncedLocation || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLocation]);

  const page = meta?.page ?? 1;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="bg-card ring-foreground/10 -mt-14 space-y-3 rounded-2xl p-4 shadow-lg ring-1 sm:-mt-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Vị trí, từ khóa..."
          />
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Địa điểm..."
          />
          <Select
            value={initialEmploymentType || ALL}
            onValueChange={(value) =>
              pushParams({ employmentType: value === ALL ? undefined : value, page: undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Hình thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả hình thức</SelectItem>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={initialWorkMode || ALL}
            onValueChange={(value) =>
              pushParams({ workMode: value === ALL ? undefined : value, page: undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Địa điểm làm việc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả</SelectItem>
              {WORK_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {WORK_MODE_LABEL[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={initialLevel || ALL}
            onValueChange={(value) =>
              pushParams({ level: value === ALL ? undefined : value, page: undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Cấp bậc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả cấp bậc</SelectItem>
              {JOB_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {JOB_LEVEL_LABEL[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.length > 0 && (
            <Select
              value={initialCategoryId || ALL}
              onValueChange={(value) =>
                pushParams({ categoryId: value === ALL ? undefined : value, page: undefined })
              }
            >
              <SelectTrigger className="sm:w-64">
                <SelectValue placeholder="Ngành nghề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả ngành nghề</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={initialSort || DEFAULT_SORT}
            onValueChange={(value) =>
              pushParams({ sort: value === DEFAULT_SORT ? undefined : value, page: undefined })
            }
          >
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {JOB_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {JOB_SORT_LABEL[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCandidate && <SaveSearchButton />}
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Kỹ năng:</span>
            {skills.map((skill) => {
              const checked = initialSkillIds.includes(skill.id);
              return (
                <label key={skill.id} className="flex items-center gap-1.5">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      const next = value
                        ? [...initialSkillIds, skill.id]
                        : initialSkillIds.filter((id) => id !== skill.id);
                      pushParams({ skillIds: next.length > 0 ? next.join(",") : undefined, page: undefined });
                    }}
                  />
                  {skill.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", isPending && "opacity-60")}>
        {items.map((job) => (
          <JobCard key={job.id} job={job} bookmarkedJobIds={bookmarkedJobIds} />
        ))}
        {items.length === 0 && (
          <p className="text-muted-foreground col-span-full py-10 text-center text-sm">
            Không tìm thấy việc làm phù hợp.
          </p>
        )}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPageChange={(next) => pushParams({ page: String(next) })}
      />
    </div>
  );
}
