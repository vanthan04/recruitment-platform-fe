"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { EMPLOYMENT_TYPE_LABEL, JOB_LEVEL_LABEL, WORK_MODE_LABEL } from "@/lib/constants/enum-label";
import { createJob, updateJob } from "@/lib/services/job.service";
import type { Category } from "@/lib/types/category";
import type { CreateJobInput, EmploymentType, Job, JobLevel, WorkMode } from "@/lib/types/job";
import type { Skill } from "@/lib/types/skill";

const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[];
const WORK_MODES = Object.keys(WORK_MODE_LABEL) as WorkMode[];
const JOB_LEVELS = Object.keys(JOB_LEVEL_LABEL) as JobLevel[];
const NONE = "none";

// Textareas keep the familiar "one item per line" UX — split into an array
// (dropping blank lines) only at submit time, since the API stores each as
// a string[] rather than a single text blob.
function linesToArray(text: string | undefined): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const jobSchema = z
  .object({
    title: z.string().min(2, "Vui lòng nhập tiêu đề tin tuyển dụng"),
    description: z.string().min(1, "Vui lòng nhập mô tả công việc"),
    location: z.string().min(1, "Vui lòng nhập địa điểm làm việc"),
    address: z.string().optional(),
    employmentType: z.string().min(1),
    workMode: z.string().min(1),
    level: z.string().optional(),
    categoryId: z.string().optional(),
    salaryMin: z.string().optional(),
    salaryMax: z.string().optional(),
    currency: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
    workingHours: z.string().optional(),
    expiresAt: z.string().optional(),
    skillIds: z.array(z.string()).optional(),
  })
  .refine(
    (values) => {
      if (!values.salaryMin || !values.salaryMax) return true;
      return Number(values.salaryMax) >= Number(values.salaryMin);
    },
    { message: "Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu", path: ["salaryMax"] },
  );

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  mode: "create" | "edit";
  job?: Job;
  categories: Category[];
  skills: Skill[];
}

export function JobForm({ mode, job, categories, skills }: JobFormProps) {
  const { run, isPending } = useApiToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title ?? "",
      description: job?.description ?? "",
      location: job?.location ?? "",
      address: job?.address ?? "",
      employmentType: job?.employmentType ?? "FULL_TIME",
      workMode: job?.workMode ?? "ONSITE",
      level: job?.level ?? NONE,
      categoryId: job?.categoryId ?? NONE,
      salaryMin: job?.salaryMin != null ? String(job.salaryMin) : "",
      salaryMax: job?.salaryMax != null ? String(job.salaryMax) : "",
      currency: job?.currency ?? "VND",
      requirements: job?.requirements?.join("\n") ?? "",
      benefits: job?.benefits?.join("\n") ?? "",
      workingHours: job?.workingHours?.join("\n") ?? "",
      expiresAt: job?.expiresAt ? job.expiresAt.slice(0, 10) : "",
      skillIds: job?.skills.map((skill) => skill.id) ?? [],
    },
  });

  const onSubmit = handleSubmit((values) => {
    const input: CreateJobInput = {
      title: values.title,
      description: values.description,
      location: values.location,
      address: values.address || undefined,
      employmentType: values.employmentType as EmploymentType,
      workMode: values.workMode as WorkMode,
      level: values.level && values.level !== NONE ? (values.level as JobLevel) : undefined,
      categoryId: values.categoryId && values.categoryId !== NONE ? values.categoryId : undefined,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
      currency: values.currency || undefined,
      requirements: linesToArray(values.requirements),
      benefits: linesToArray(values.benefits),
      workingHours: linesToArray(values.workingHours),
      expiresAt: values.expiresAt || undefined,
      skillIds: values.skillIds,
    };

    if (mode === "create") {
      run(() => createJob(input), { successMessage: "Đăng tin thành công." });
    } else if (job) {
      run(() => updateJob(job.id, input), { successMessage: "Cập nhật tin thành công." });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="bg-card ring-foreground/10 space-y-4 rounded-xl p-5 shadow-sm ring-1 sm:p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="title">Tiêu đề tin tuyển dụng</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Mô tả công việc</Label>
        <Textarea id="description" rows={6} {...register("description")} />
        {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">Địa điểm làm việc</Label>
        <Input id="location" placeholder="Hà Nội, Hồ Chí Minh..." {...register("location")} />
        {errors.location && <p className="text-destructive text-sm">{errors.location.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Địa chỉ cụ thể (không bắt buộc)</Label>
        <Input id="address" placeholder="Số 520 đường CMT8, Phường Nhiêu Lộc" {...register("address")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Hình thức làm việc</Label>
          <Controller
            control={control}
            name="employmentType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Hình thức làm việc từ xa</Label>
          <Controller
            control={control}
            name="workMode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn địa điểm làm việc" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {WORK_MODE_LABEL[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cấp bậc</Label>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn cấp bậc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Không xác định</SelectItem>
                  {JOB_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {JOB_LEVEL_LABEL[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Ngành nghề</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn ngành nghề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Không xác định</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {skills.length > 0 && (
        <div className="space-y-1.5">
          <Label>Kỹ năng</Label>
          <Controller
            control={control}
            name="skillIds"
            render={({ field }) => (
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3">
                {skills.map((skill) => {
                  const selected = field.value ?? [];
                  const checked = selected.includes(skill.id);
                  return (
                    <label key={skill.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          field.onChange(
                            value ? [...selected, skill.id] : selected.filter((id) => id !== skill.id),
                          )
                        }
                      />
                      {skill.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="salaryMin">Lương tối thiểu</Label>
          <Input id="salaryMin" type="number" min={0} {...register("salaryMin")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="salaryMax">Lương tối đa</Label>
          <Input id="salaryMax" type="number" min={0} {...register("salaryMax")} />
          {errors.salaryMax && <p className="text-destructive text-sm">{errors.salaryMax.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Đơn vị tiền tệ</Label>
          <Input id="currency" {...register("currency")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="requirements">Yêu cầu ứng viên</Label>
        <Textarea
          id="requirements"
          rows={4}
          placeholder={
            "Mỗi dòng là một yêu cầu, ví dụ:\n2+ năm kinh nghiệm Node.js\nTốt nghiệp Đại học chuyên ngành CNTT"
          }
          {...register("requirements")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="benefits">Quyền lợi</Label>
        <Textarea
          id="benefits"
          rows={4}
          placeholder={"Mỗi dòng là một quyền lợi, ví dụ:\nBảo hiểm sức khỏe\nDu lịch hàng năm"}
          {...register("benefits")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="workingHours">Thời gian làm việc</Label>
        <Textarea
          id="workingHours"
          rows={2}
          placeholder={"Mỗi dòng một ý, ví dụ:\nThứ 2 - Thứ 6 (08:00 - 17:00)\nNghỉ trưa 12:00 - 13:00"}
          {...register("workingHours")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="expiresAt">Hạn nộp hồ sơ</Label>
        <Input id="expiresAt" type="date" {...register("expiresAt")} />
      </div>

      <Button type="submit" className="rounded-full" disabled={isPending}>
        {isPending ? "Đang lưu..." : mode === "create" ? "Đăng tin" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
