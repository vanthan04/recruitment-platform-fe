"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { EMPLOYMENT_TYPE_LABEL, JOB_LEVEL_LABEL, WORK_MODE_LABEL } from "@/lib/constants/enum-label";
import { createJob, updateJob } from "@/lib/services/job.service";
import type { Category } from "@/lib/types/category";
import {
  JOB_EXTRA_INFO_KEY,
  type CreateJobInput,
  type EmploymentType,
  type Job,
  type JobLevel,
  type WorkMode,
} from "@/lib/types/job";

const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[];
const WORK_MODES = Object.keys(WORK_MODE_LABEL) as WorkMode[];
const JOB_LEVELS = Object.keys(JOB_LEVEL_LABEL) as JobLevel[];
const NONE = "none";

const jobSchema = z
  .object({
    title: z.string().min(2, "Vui lòng nhập tiêu đề tin tuyển dụng"),
    description: z.string().min(1, "Vui lòng nhập mô tả công việc"),
    location: z.string().min(1, "Vui lòng nhập địa điểm làm việc"),
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
    applicationMethod: z.string().optional(),
    expiresAt: z.string().optional(),
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
}

export function JobForm({ mode, job, categories }: JobFormProps) {
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
      employmentType: job?.employmentType ?? "FULL_TIME",
      workMode: job?.workMode ?? "ONSITE",
      level: job?.level ?? NONE,
      categoryId: job?.categoryId ?? NONE,
      salaryMin: job?.salaryMin != null ? String(job.salaryMin) : "",
      salaryMax: job?.salaryMax != null ? String(job.salaryMax) : "",
      currency: job?.currency ?? "VND",
      requirements: job?.requirements ?? "",
      benefits: job?.benefits ?? "",
      workingHours: job?.extraInfo?.[JOB_EXTRA_INFO_KEY.WORKING_HOURS] ?? "",
      applicationMethod: job?.extraInfo?.[JOB_EXTRA_INFO_KEY.APPLICATION_METHOD] ?? "",
      expiresAt: job?.expiresAt ? job.expiresAt.slice(0, 10) : "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const extraInfo: Record<string, string> = {};
    if (values.workingHours) extraInfo[JOB_EXTRA_INFO_KEY.WORKING_HOURS] = values.workingHours;
    if (values.applicationMethod) extraInfo[JOB_EXTRA_INFO_KEY.APPLICATION_METHOD] = values.applicationMethod;

    const input: CreateJobInput = {
      title: values.title,
      description: values.description,
      location: values.location,
      employmentType: values.employmentType as EmploymentType,
      workMode: values.workMode as WorkMode,
      level: values.level && values.level !== NONE ? (values.level as JobLevel) : undefined,
      categoryId: values.categoryId && values.categoryId !== NONE ? values.categoryId : undefined,
      salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
      salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
      currency: values.currency || undefined,
      requirements: values.requirements || undefined,
      benefits: values.benefits || undefined,
      extraInfo: Object.keys(extraInfo).length > 0 ? extraInfo : undefined,
      expiresAt: values.expiresAt || undefined,
    };

    if (mode === "create") {
      run(() => createJob(input), { successMessage: "Đăng tin thành công." });
    } else if (job) {
      run(() => updateJob(job.id, input), { successMessage: "Cập nhật tin thành công." });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <Input id="location" {...register("location")} />
        {errors.location && <p className="text-destructive text-sm">{errors.location.message}</p>}
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
        <Textarea id="requirements" rows={4} {...register("requirements")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="benefits">Quyền lợi</Label>
        <Textarea id="benefits" rows={4} {...register("benefits")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="workingHours">Thời gian làm việc</Label>
        <Textarea
          id="workingHours"
          rows={2}
          placeholder="Thứ 2 - Thứ 6 (08:00 - 17:00)"
          {...register("workingHours")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="applicationMethod">Cách thức ứng tuyển</Label>
        <Textarea id="applicationMethod" rows={2} {...register("applicationMethod")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="expiresAt">Hạn nộp hồ sơ</Label>
        <Input id="expiresAt" type="date" {...register("expiresAt")} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : mode === "create" ? "Đăng tin" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
