"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { deleteSavedSearch } from "@/lib/services/saved-search.service";

export function DeleteSavedSearchButton({ id }: { id: string }) {
  const { run, isPending } = useApiToast();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => {
        if (confirm("Xoá tìm kiếm đã lưu này?")) {
          run(() => deleteSavedSearch(id), { successMessage: "Đã xoá." });
        }
      }}
    >
      Xoá
    </Button>
  );
}
