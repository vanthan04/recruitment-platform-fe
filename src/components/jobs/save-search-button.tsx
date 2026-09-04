"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { EMPLOYMENT_TYPE_LABEL, WORK_MODE_LABEL } from "@/lib/constants/enum-label";
import { createSavedSearch } from "@/lib/services/saved-search.service";
import type { EmploymentType, WorkMode } from "@/lib/types/job";
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
          employmentType: parseEnumParam<EmploymentType>(
            searchParams.get("employmentType"),
            Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[],
          ),
          workMode: parseEnumParam<WorkMode>(
            searchParams.get("workMode"),
            Object.keys(WORK_MODE_LABEL) as WorkMode[],
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
