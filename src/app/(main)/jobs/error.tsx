"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
      <h2 className="text-lg font-semibold">Không tải được danh sách việc làm</h2>
      <p className="text-muted-foreground text-sm">Vui lòng kiểm tra kết nối backend và thử lại.</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
