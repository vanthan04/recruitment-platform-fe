"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { resetPassword } from "@/lib/services/auth.service";

const resetPasswordSchema = z
  .object({
    code: z.string().length(6, "Mã xác thực gồm 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const { run, isPending } = useApiToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = handleSubmit((values) => {
    run(() => resetPassword({ code: values.code, newPassword: values.newPassword }));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="code">Mã xác thực</Label>
        <Input id="code" autoComplete="one-time-code" maxLength={6} {...register("code")} />
        {errors.code && <p className="text-destructive text-sm">{errors.code.message}</p>}
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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  );
}
