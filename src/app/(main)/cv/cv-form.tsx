"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { createCv, updateCvTitle } from "@/lib/services/cv.service";
import type { Cv } from "@/lib/types/cv";

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx";

/**
 * CV is file-only: creating one is an upload (title + file), editing one
 * only lets you rename it — replacing the file is a separate action, not
 * part of this form.
 */
export function CvForm({ cv }: { cv?: Cv }) {
  const { run, isPending } = useApiToast();
  const [title, setTitle] = useState(cv?.title ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề CV");
      return;
    }
    setError(null);

    if (cv) {
      run(() => updateCvTitle(cv.id, title.trim()), { successMessage: "Đã lưu CV." });
      return;
    }

    if (!file) {
      setError("Vui lòng chọn file CV (PDF, DOC hoặc DOCX)");
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("file", file);
    // createCv redirects to the CV list itself on success.
    run(() => createCv(formData));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Tiêu đề CV</Label>
        <Input
          id="title"
          placeholder="VD: Frontend Developer CV"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      {!cv && (
        <div className="space-y-1.5">
          <Label htmlFor="file">File CV (PDF, DOC, DOCX)</Label>
          <Input
            id="file"
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : cv ? "Lưu thay đổi" : "Tải CV lên"}
      </Button>
    </form>
  );
}
