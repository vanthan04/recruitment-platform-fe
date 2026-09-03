"use client";

import { ErrorState } from "@/components/shared/error-state";

// Root-level fallback — catches errors that a more specific error.tsx
// doesn't (e.g. the (auth) route group has none of its own, and a layout
// can't be caught by an error.tsx at the same segment level).
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState error={error} reset={reset} title="Đã có lỗi xảy ra" />;
}
