"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
}

export function ErrorState({ error, reset, title }: ErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">Vui lòng kiểm tra kết nối backend và thử lại.</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
