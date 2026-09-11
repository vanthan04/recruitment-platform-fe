"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteSavedSearch } from "@/lib/services/saved-search.service";

export function DeleteSavedSearchButton({ id }: { id: string }) {
  const { run, isPending } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={async () => {
          if (await confirm({ title: "Xoá tìm kiếm đã lưu này?", destructive: true })) {
            run(() => deleteSavedSearch(id), { successMessage: "Đã xoá." });
          }
        }}
      >
        Xoá
      </Button>
      {ConfirmDialog}
    </>
  );
}
