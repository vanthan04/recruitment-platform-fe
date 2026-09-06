"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

// Search/filter/pagination all live in the URL, so a change simply triggers
// a server re-render of the page with new searchParams — no client-side
// REST call is made here.
export function usePushParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return { pushParams, searchParams, isPending };
}

/**
 * A text input whose value is debounced and synced to a URL query param.
 * Resets `page` whenever the synced value actually changes.
 */
export function useDebouncedUrlFilter(
  paramKey: string,
  initialValue: string,
  pushParams: (next: Record<string, string | undefined>) => void,
  searchParams: URLSearchParams,
  delayMs = 400,
) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebouncedValue(value, delayMs);

  useEffect(() => {
    if (debounced === (searchParams.get(paramKey) ?? "")) return;
    pushParams({ [paramKey]: debounced || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return [value, setValue] as const;
}
