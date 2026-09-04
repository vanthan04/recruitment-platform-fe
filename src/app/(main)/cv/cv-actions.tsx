"use client";

import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { deleteCv, getCvDownloadUrl, publishCv } from "@/lib/services/cv.service";

export function PublishCvButton({ cvId }: { cvId: string }) {
  const { run, isPending } = useApiToast();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => run(() => publishCv(cvId), { successMessage: "Đã xuất bản CV." })}
    >
      {isPending ? "Đang xuất bản..." : "Xuất bản"}
    </Button>
  );
}

export function DeleteCvButton({ cvId }: { cvId: string }) {
  const { run, isPending } = useApiToast();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={() => {
        if (confirm("Xoá CV này?")) run(() => deleteCv(cvId), { successMessage: "Đã xoá CV." });
      }}
    >
      Xoá
    </Button>
  );
}

/** Fetches a short-lived presigned URL then opens it — the actual file bytes come straight from S3. */
export function DownloadCvButton({ cvId }: { cvId: string }) {
  const { callApi, isLoading } = useApiToast();

  async function handleDownload() {
    const result = await callApi(getCvDownloadUrl(cvId));
    if (result) window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={isLoading} onClick={handleDownload}>
      {isLoading ? "Đang tải..." : "Tải xuống"}
    </Button>
  );
}
