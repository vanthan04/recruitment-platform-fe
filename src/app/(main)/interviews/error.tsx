"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function InterviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} title="Không tải được lịch phỏng vấn" />;
}
