"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} title="Không tải được danh sách việc làm" />;
}
