"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiToast } from "@/hooks/use-api-toast";
import { GENDER_LABEL } from "@/lib/constants/enum-label";
import { updateProfile } from "@/lib/services/auth.service";
import type { AuthUser, Gender } from "@/lib/types/auth";

const profileSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên"),
  phoneNumber: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  birthDate: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const GENDERS = Object.keys(GENDER_LABEL) as Gender[];

export function ProfileForm({ user }: { user: AuthUser }) {
  const { run, isPending } = useApiToast();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.profile.fullName,
      phoneNumber: user.profile.phoneNumber ?? "",
      gender: user.profile.gender ?? undefined,
      birthDate: user.profile.birthDate ?? "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    run(
      () =>
        updateProfile({
          fullName: values.fullName,
          phoneNumber: values.phoneNumber || undefined,
          gender: values.gender,
          birthDate: values.birthDate || undefined,
        }),
      { successMessage: "Cập nhật hồ sơ thành công." },
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Họ tên</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-destructive text-sm">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phoneNumber">Số điện thoại</Label>
        <Input id="phoneNumber" {...register("phoneNumber")} />
        {errors.phoneNumber && <p className="text-destructive text-sm">{errors.phoneNumber.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Giới tính</Label>
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Ngày sinh</Label>
          <Input id="birthDate" type="date" {...register("birthDate")} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
