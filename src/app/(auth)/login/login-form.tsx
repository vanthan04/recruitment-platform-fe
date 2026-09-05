"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useApiToast } from "@/hooks/use-api-toast";
import { PATH } from "@/lib/constants/path";
import { login } from "@/lib/services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { run, isPending } = useApiToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    run(() => login(values));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="Nhập email"
          className="h-11 rounded-xl px-4 text-base"
          {...register("email")}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link href={PATH.FORGOT_PASSWORD} className="text-primary text-sm font-medium hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          className="h-11 rounded-xl px-4 text-base"
          {...register("password")}
        />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="h-12 w-full rounded-full text-base font-semibold" disabled={isPending}>
        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        {!isPending && <ArrowRight className="size-4" />}
      </Button>
      <SocialLoginButtons />
    </form>
  );
}
