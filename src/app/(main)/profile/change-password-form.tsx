"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { changePassword } from "@/lib/services/auth.service";

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { run, isPending } = useApiToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit((values) => {
    run(
      () =>
        changePassword({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      {
        successMessage: "Đổi mật khẩu thành công.",
        onSuccess: () => reset(),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
        <Input
          id="oldPassword"
          type="password"
          autoComplete="current-password"
          {...register("oldPassword")}
        />
        {errors.oldPassword && <p className="text-destructive text-sm">{errors.oldPassword.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
        {errors.newPassword && <p className="text-destructive text-sm">{errors.newPassword.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang đổi..." : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}
