"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} title="Không tải được đơn ứng tuyển" />;
}
