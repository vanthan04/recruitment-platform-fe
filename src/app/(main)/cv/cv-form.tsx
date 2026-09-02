"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm, type Control } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { createCv, updateCv } from "@/lib/services/cv.service";
import type { Cv } from "@/lib/types/cv";

const experienceSchema = z.object({
  company: z.string().min(1, "Bắt buộc"),
  position: z.string().min(1, "Bắt buộc"),
  startDate: z.string().min(1, "Bắt buộc"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  school: z.string().min(1, "Bắt buộc"),
  degree: z.string().min(1, "Bắt buộc"),
  startDate: z.string().min(1, "Bắt buộc"),
  endDate: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  description: z.string().optional(),
});

const skillSchema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  level: z.string().optional(),
});

const cvSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề CV"),
  summary: z.string().optional(),
  experiences: z.array(experienceSchema),
  educations: z.array(educationSchema),
  skills: z.array(skillSchema),
});

type CvFormValues = z.infer<typeof cvSchema>;

function toDefaultDate(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function defaultsFromCv(cv?: Cv): CvFormValues {
  return {
    title: cv?.title ?? "",
    summary: cv?.summary ?? "",
    experiences: (cv?.experiences ?? []).map((experience) => ({
      ...experience,
      startDate: toDefaultDate(experience.startDate),
      endDate: toDefaultDate(experience.endDate),
    })),
    educations: (cv?.educations ?? []).map((education) => ({
      ...education,
      startDate: toDefaultDate(education.startDate),
      endDate: toDefaultDate(education.endDate),
    })),
    skills: cv?.skills ?? [],
  };
}

export function CvForm({ cv }: { cv?: Cv }) {
  const { run, isPending } = useApiToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CvFormValues>({ resolver: zodResolver(cvSchema), defaultValues: defaultsFromCv(cv) });

  const experienceFields = useFieldArray({ control, name: "experiences" });
  const educationFields = useFieldArray({ control, name: "educations" });
  const skillFields = useFieldArray({ control, name: "skills" });

  const onSubmit = handleSubmit((values) => {
    if (cv) {
      run(() => updateCv(cv.id, values), { successMessage: "Đã lưu CV." });
    } else {
      // createCv redirects to the new CV's edit page itself on success.
      run(() => createCv(values));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Tiêu đề CV</Label>
          <Input id="title" placeholder="VD: Frontend Developer CV" {...register("title")} />
          {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Giới thiệu bản thân</Label>
          <Textarea id="summary" rows={4} {...register("summary")} />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Kinh nghiệm làm việc</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              experienceFields.append({ company: "", position: "", startDate: "", description: "" })
            }
          >
            <Plus className="size-4" /> Thêm
          </Button>
        </div>
        {experienceFields.fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Công ty</Label>
                <Input {...register(`experiences.${index}.company`)} />
                {errors.experiences?.[index]?.company && (
                  <p className="text-destructive text-sm">{errors.experiences[index]?.company?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Vị trí</Label>
                <Input {...register(`experiences.${index}.position`)} />
                {errors.experiences?.[index]?.position && (
                  <p className="text-destructive text-sm">{errors.experiences[index]?.position?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...register(`experiences.${index}.startDate`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...register(`experiences.${index}.endDate`)} />
              </div>
            </div>
            <CurrentCheckbox control={control} index={index} />
            <div className="space-y-1.5">
              <Label>Mô tả công việc</Label>
              <Textarea rows={3} {...register(`experiences.${index}.description`)} />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => experienceFields.remove(index)}>
              <Trash2 className="size-4" /> Xoá
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Học vấn</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => educationFields.append({ school: "", degree: "", startDate: "" })}
          >
            <Plus className="size-4" /> Thêm
          </Button>
        </div>
        {educationFields.fields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Trường</Label>
                <Input {...register(`educations.${index}.school`)} />
                {errors.educations?.[index]?.school && (
                  <p className="text-destructive text-sm">{errors.educations[index]?.school?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Bằng cấp</Label>
                <Input {...register(`educations.${index}.degree`)} />
                {errors.educations?.[index]?.degree && (
                  <p className="text-destructive text-sm">{errors.educations[index]?.degree?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Chuyên ngành</Label>
                <Input {...register(`educations.${index}.fieldOfStudy`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...register(`educations.${index}.startDate`)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...register(`educations.${index}.endDate`)} />
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => educationFields.remove(index)}>
              <Trash2 className="size-4" /> Xoá
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Kỹ năng</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => skillFields.append({ name: "" })}>
            <Plus className="size-4" /> Thêm
          </Button>
        </div>
        {skillFields.fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Kỹ năng</Label>
              <Input {...register(`skills.${index}.name`)} />
              {errors.skills?.[index]?.name && (
                <p className="text-destructive text-sm">{errors.skills[index]?.name?.message}</p>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label>Mức độ</Label>
              <Input placeholder="VD: Advanced" {...register(`skills.${index}.level`)} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => skillFields.remove(index)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu CV"}
      </Button>
    </form>
  );
}

function CurrentCheckbox({ control, index }: { control: Control<CvFormValues>; index: number }) {
  return (
    <Controller
      control={control}
      name={`experiences.${index}.isCurrent`}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={field.value ?? false}
            onCheckedChange={(checked) => field.onChange(checked === true)}
          />
          Đang làm việc tại đây
        </label>
      )}
    />
  );
}
