"use client";

import { useTransition } from "react";
import { toast } from "sonner";

interface ActionResult {
  error?: string;
}

interface UseApiToastOptions<T> {
  successMessage?: string;
  onSuccess?: (result: T) => void;
}

// Wraps a Server Action call in a transition and turns its result into a
// toast — {error} shows toast.error, anything else (including a redirect()
// thrown by the action, which is intentionally left uncaught here so Next
// can still perform the navigation) is treated as success.
export function useApiToast() {
  const [isPending, startTransition] = useTransition();

  function run<T extends ActionResult | void>(action: () => Promise<T>, options?: UseApiToastOptions<T>) {
    startTransition(async () => {
      const result = await action();
      if (result && typeof result === "object" && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (options?.successMessage) toast.success(options.successMessage);
      options?.onSuccess?.(result as T);
    });
  }

  return { run, isPending };
}
