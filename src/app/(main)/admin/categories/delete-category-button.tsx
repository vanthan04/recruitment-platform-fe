"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { deleteCategory } from "@/lib/services/category.service";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const { run, isPending } = useApiToast();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (
          confirm(`Xoá danh mục "${name}"? Các tin tuyển dụng đang dùng danh mục này sẽ không còn danh mục.`)
        ) {
          run(() => deleteCategory(id), { successMessage: "Đã xoá danh mục." });
        }
      }}
    >
      Xoá
    </Button>
  );
}
