"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { JobCard } from "@/components/jobs/job-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { JOB_LEVEL_LABEL, JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import type { Category } from "@/lib/types/category";
import type { ListMeta } from "@/lib/types/common";
import type { Job, JobLevel, JobType } from "@/lib/types/job";
import { cn } from "@/lib/utils";

const ALL = "all";
const JOB_TYPES = Object.keys(JOB_TYPE_LABEL) as JobType[];
const JOB_LEVELS = Object.keys(JOB_LEVEL_LABEL) as JobLevel[];

interface JobsListProps {
  items: Job[];
  meta?: ListMeta;
  categories: Category[];
  bookmarkedJobIds?: Set<string>;
  initialKeyword: string;
  initialLocation: string;
  initialJobType: string;
  initialLevel: string;
  initialCategoryId: string;
}

export function JobsList({
  items,
  meta,
  categories,
  bookmarkedJobIds,
  initialKeyword,
  initialLocation,
  initialJobType,
  initialLevel,
  initialCategoryId,
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          value={initialJobType || ALL}
          onValueChange={(value) =>
            pushParams({ jobType: value === ALL ? undefined : value, page: undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Hình thức" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả hình thức</SelectItem>
            {JOB_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {JOB_TYPE_LABEL[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={initialLevel || ALL}
          onValueChange={(value) => pushParams({ level: value === ALL ? undefined : value, page: undefined })}
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

      <div className={cn("grid gap-4 sm:grid-cols-2", isPending && "opacity-60")}>
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
