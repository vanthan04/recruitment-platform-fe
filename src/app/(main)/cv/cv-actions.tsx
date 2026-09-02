"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useApiToast } from "@/hooks/use-api-toast";
import { deleteCv, publishCv, uploadCvFile } from "@/lib/services/cv.service";

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

export function UploadCvFileButton({ cvId }: { cvId: string }) {
  const { run, isPending } = useApiToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);
    run(() => uploadCvFile(cvId, formData), { successMessage: "Đã tải file CV lên." });
    event.target.value = "";
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? "Đang tải lên..." : "Tải file CV"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
