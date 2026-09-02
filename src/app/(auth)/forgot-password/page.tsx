import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Quên mật khẩu</h1>
        <p className="text-muted-foreground text-sm">Nhập email để nhận mã khôi phục mật khẩu</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
