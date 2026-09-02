import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Đặt lại mật khẩu</h1>
        <p className="text-muted-foreground text-sm">Nhập mã đã nhận qua email và mật khẩu mới</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
