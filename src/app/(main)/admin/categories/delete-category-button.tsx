"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteCategory } from "@/lib/services/category.service";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const { run, isPending } = useApiToast();
  const { confirm, ConfirmDialog } = useConfirm();

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={isPending}
        onClick={async () => {
          const confirmed = await confirm({
            title: `Xoá danh mục "${name}"?`,
            description: "Các tin tuyển dụng đang dùng danh mục này sẽ không còn danh mục.",
            destructive: true,
          });
          if (confirmed) {
            run(() => deleteCategory(id), { successMessage: "Đã xoá danh mục." });
          }
        }}
      >
        Xoá
      </Button>
      {ConfirmDialog}
    </>
  );
}
