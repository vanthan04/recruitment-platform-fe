"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { updateCategory } from "@/lib/services/category.service";
import type { Category } from "@/lib/types/category";

export function EditCategoryDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const { run, isPending } = useApiToast();

  function handleOpenChange(next: boolean) {
    if (next) setName(category.name);
    setOpen(next);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    run(() => updateCategory(category.id, { name: name.trim() }), {
      successMessage: "Đã cập nhật danh mục.",
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Sửa
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa danh mục</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="category-name">Tên danh mục</Label>
          <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending || !name.trim()} onClick={handleSubmit}>
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
