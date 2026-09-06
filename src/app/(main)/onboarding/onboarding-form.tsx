"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ProvinceWardFields } from "@/components/shared/province-ward-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiToast } from "@/hooks/use-api-toast";
import { GENDER_LABEL } from "@/lib/constants/enum-label";
import { completeRecruiterOnboarding } from "@/lib/services/onboarding.service";
import type { AuthUser, Gender } from "@/lib/types/auth";
import type { LocationOption } from "@/lib/services/location.service";

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên"),
  phoneNumber: z.string().min(8, "Số điện thoại không hợp lệ"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  companyName: z.string().min(2, "Vui lòng nhập tên công ty"),
  province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  ward: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const GENDERS = Object.keys(GENDER_LABEL) as Gender[];

interface OnboardingFormProps {
  user: AuthUser;
  provinces: LocationOption[];
}

export function OnboardingForm({ user, provinces }: OnboardingFormProps) {
  const { run, isPending } = useApiToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: user.profile.fullName,
      phoneNumber: user.profile.phoneNumber ?? "",
      gender: user.profile.gender ?? undefined,
      companyName: "",
      province: "",
      ward: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    run(() => completeRecruiterOnboarding(values));
  });

  return (
    <form
      onSubmit={onSubmit}
      className="bg-card ring-foreground/10 space-y-5 rounded-xl p-5 shadow-sm ring-1 sm:p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Họ tên *</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-destructive text-sm">{errors.fullName.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Số điện thoại cá nhân *</Label>
          <Input id="phoneNumber" {...register("phoneNumber")} />
          {errors.phoneNumber && <p className="text-destructive text-sm">{errors.phoneNumber.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Giới tính *</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {GENDER_LABEL[gender]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <p className="text-destructive text-sm">Vui lòng chọn giới tính</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName">Công ty *</Label>
        <Input id="companyName" placeholder="Nhập tên công ty" {...register("companyName")} />
        {errors.companyName && <p className="text-destructive text-sm">{errors.companyName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Địa điểm làm việc *</Label>
        <ProvinceWardFields
          control={control}
          provinceFieldName="province"
          wardFieldName="ward"
          provinces={provinces}
        />
        {errors.province && <p className="text-destructive text-sm">{errors.province.message}</p>}
      </div>

      <Button type="submit" className="h-12 w-full rounded-full text-base font-semibold" disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu và Tiếp tục"}
        {!isPending && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
