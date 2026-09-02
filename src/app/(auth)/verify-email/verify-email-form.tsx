"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { verifyEmail } from "@/lib/services/auth.service";

const verifyEmailSchema = z.object({
  code: z.string().length(6, "Mã xác thực gồm 6 ký tự"),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export function VerifyEmailForm() {
  const { run, isPending } = useApiToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({ resolver: zodResolver(verifyEmailSchema) });

  const onSubmit = handleSubmit((values) => {
    // On success verifyEmail() redirects to /login itself (throwing internally),
    // so a successMessage here would never actually run.
    run(() => verifyEmail(values));
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="code">Mã xác thực</Label>
        <Input id="code" autoComplete="one-time-code" maxLength={6} {...register("code")} />
        {errors.code && <p className="text-destructive text-sm">{errors.code.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Đang xác thực..." : "Xác thực"}
      </Button>
    </form>
  );
}
