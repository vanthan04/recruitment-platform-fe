"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import { createSavedSearch } from "@/lib/services/saved-search.service";
import type { JobType } from "@/lib/types/job";
import { parseEnumParam } from "@/lib/utils";

export function SaveSearchButton() {
  const searchParams = useSearchParams();
  const { run, isPending } = useApiToast();

  function handleClick() {
    run(
      () =>
        createSavedSearch({
          keyword: searchParams.get("keyword") || undefined,
          location: searchParams.get("location") || undefined,
          categoryId: searchParams.get("categoryId") || undefined,
          jobType: parseEnumParam<JobType>(
            searchParams.get("jobType"),
            Object.keys(JOB_TYPE_LABEL) as JobType[],
          ),
        }),
      { successMessage: "Đã lưu tìm kiếm. Bạn sẽ nhận email khi có việc làm phù hợp." },
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
      {isPending ? "Đang lưu..." : "Lưu tìm kiếm này"}
    </Button>
  );
}
