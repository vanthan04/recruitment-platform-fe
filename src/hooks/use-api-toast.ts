"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/error";

interface UseApiToastOptions<T> {
  successMessage?: string;
  onSuccess?: (result: T) => void;
  /** Called after the error toast — useful for reverting optimistic UI updates. */
  onError?: (error: unknown) => void;
}

function handleError(error: unknown, onError?: (e: unknown) => void) {
  // `redirect()` và `notFound()` của Next.js throw một special error —
  // phải re-throw để framework xử lý navigation / 404.
  if (isRedirectError(error)) throw error;

  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
  }
  onError?.(error);
}

export function useApiToast() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Dành cho **Server Action** có thể gọi `redirect()` bên trong.
   * Fire-and-forget — không trả Promise, dùng `useTransition` nên không block UI.
   *
   * ```ts
   * run(() => login(values));
   * run(() => deleteCv(id), { successMessage: "Đã xoá." });
   * ```
   */
  function run<T>(action: () => Promise<T>, options?: UseApiToastOptions<T>) {
    startTransition(async () => {
      try {
        const result = await action();
        if (options?.successMessage) toast.success(options.successMessage);
        options?.onSuccess?.(result);
      } catch (error) {
        handleError(error, options?.onError);
      }
    });
  }

  /**
   * Dành cho **Promise thông thường** khi cần `await` kết quả để làm tiếp.
   * Có `isLoading` state riêng. Trả `T` nếu thành công, `undefined` nếu lỗi.
   *
   * ```ts
   * const data = await callApi(api.get<Job[]>("/jobs"), {
   *   successMessage: "Tải thành công.",
   * });
   * if (data) setJobs(data);
   * ```
   */
  async function callApi<T>(promise: Promise<T>, options?: UseApiToastOptions<T>): Promise<T | undefined> {
    setIsLoading(true);
    try {
      const result = await promise;
      if (options?.successMessage) toast.success(options.successMessage);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      handleError(error, options?.onError);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }

  return { run, callApi, isPending, isLoading };
}
