"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { COMPANY_SIZE_LABEL } from "@/lib/constants/enum-label";
import { createCompany, updateCompany } from "@/lib/services/company.service";
import type { Company, CompanySize } from "@/lib/types/company";

const companySchema = z.object({
  name: z.string().min(2, "Vui lòng nhập tên công ty"),
  description: z.string().optional().or(z.literal("")),
  website: z.string().url("Website không hợp lệ").optional().or(z.literal("")),
  size: z.enum(["SIZE_1_10", "SIZE_11_50", "SIZE_51_200", "SIZE_201_500", "SIZE_500_PLUS"]).optional(),
  address: z.string().optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const COMPANY_SIZES = Object.keys(COMPANY_SIZE_LABEL) as CompanySize[];

interface CompanyFormProps {
  mode: "create" | "edit";
  company?: Company;
}

export function CompanyForm({ mode, company }: CompanyFormProps) {
  const { run, isPending } = useApiToast();
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      description: company?.description ?? "",
      website: company?.website ?? "",
      size: company?.size ?? undefined,
      address: company?.address ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const input = {
      name: values.name,
      description: values.description || undefined,
      website: values.website || undefined,
      size: values.size,
      address: values.address || undefined,
    };

    if (mode === "create") {
      run(() => createCompany(input), {
        successMessage: "Tạo công ty thành công.",
        onSuccess: () => router.refresh(),
      });
    } else if (company) {
      run(() => updateCompany(company.id, input), { successMessage: "Cập nhật công ty thành công." });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Tên công ty</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Giới thiệu</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input id="website" placeholder="https://..." {...register("website")} />
        {errors.website && <p className="text-destructive text-sm">{errors.website.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Quy mô</Label>
          <Controller
            control={control}
            name="size"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn quy mô" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {COMPANY_SIZE_LABEL[size]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Địa chỉ</Label>
          <Input id="address" {...register("address")} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : mode === "create" ? "Tạo công ty" : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
