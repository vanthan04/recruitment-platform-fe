"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiToast } from "@/hooks/use-api-toast";
import { register as registerUser } from "@/lib/services/auth.service";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string(),
    role: z.enum(["CANDIDATE", "RECRUITER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { run, isPending } = useApiToast();
  const {
    register: registerField,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CANDIDATE" },
  });

  const onSubmit = handleSubmit((values) => {
    // The backend rejects unknown body fields — don't forward confirmPassword.
    run(() =>
      registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
      }),
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Họ tên</Label>
        <Input id="fullName" autoComplete="name" {...registerField("fullName")} />
        {errors.fullName && <p className="text-destructive text-sm">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...registerField("email")} />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input id="password" type="password" autoComplete="new-password" {...registerField("password")} />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...registerField("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Bạn là</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CANDIDATE">Người tìm việc</SelectItem>
                <SelectItem value="RECRUITER">Nhà tuyển dụng</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Đang đăng ký..." : "Đăng ký"}
      </Button>
    </form>
  );
}
