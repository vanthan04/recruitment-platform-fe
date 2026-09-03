"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiToast } from "@/hooks/use-api-toast";
import { createCategory } from "@/lib/services/category.service";

export function CreateCategoryForm() {
  const [name, setName] = useState("");
  const { run, isPending } = useApiToast();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    run(() => createCategory({ name: name.trim() }), {
      successMessage: "Đã tạo danh mục.",
      onSuccess: () => setName(""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Tên danh mục mới..."
        className="flex-1"
      />
      <Button type="submit" disabled={isPending || !name.trim()}>
        {isPending ? "Đang tạo..." : "Tạo danh mục"}
      </Button>
    </form>
  );
}
