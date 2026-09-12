"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { createCv, updateCvTitle } from "@/lib/services/cv.service";
import type { Cv } from "@/lib/types/cv";

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx";

const baseCvSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề CV"),
  file: z.custom<FileList>().optional(),
});

// File is only required when creating — editing only renames an existing CV.
const createCvSchema = baseCvSchema.extend({
  file: z.custom<FileList>((value) => value instanceof FileList && value.length > 0, {
    message: "Vui lòng chọn file CV (PDF, DOC hoặc DOCX)",
  }),
});

type CvFormValues = z.infer<typeof baseCvSchema>;

/**
 * CV is file-only: creating one is an upload (title + file), editing one
 * only lets you rename it — replacing the file is a separate action, not
 * part of this form.
 */
export function CvForm({ cv }: { cv?: Cv }) {
  const { run, isPending } = useApiToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CvFormValues>({
    resolver: zodResolver(cv ? baseCvSchema : createCvSchema),
    defaultValues: { title: cv?.title ?? "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (cv) {
      run(() => updateCvTitle(cv.id, values.title.trim()), { successMessage: "Đã lưu CV." });
      return;
    }

    const formData = new FormData();
    formData.set("title", values.title.trim());
    formData.set("file", values.file![0]);
    // createCv redirects to the CV list itself on success.
    run(() => createCv(formData));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Tiêu đề CV</Label>
        <Input id="title" placeholder="VD: Frontend Developer CV" {...register("title")} />
        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
      </div>

      {!cv && (
        <div className="space-y-1.5">
          <Label htmlFor="file">File CV (PDF, DOC, DOCX)</Label>
          <Input id="file" type="file" accept={ACCEPTED_EXTENSIONS} {...register("file")} />
          {errors.file && <p className="text-destructive text-sm">{errors.file.message}</p>}
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : cv ? "Lưu thay đổi" : "Tải CV lên"}
      </Button>
    </form>
  );
}
