"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} title="Không tải được tin nhắn" />;
}
