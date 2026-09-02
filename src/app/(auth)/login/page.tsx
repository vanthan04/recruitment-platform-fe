import Link from "next/link";
import { PATH } from "@/lib/constants/path";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Đăng nhập</h1>
        <p className="text-muted-foreground text-sm">Đăng nhập để lưu tin và ứng tuyển</p>
      </div>
      <LoginForm />
      <p className="text-muted-foreground text-center text-sm">
        <Link href={PATH.FORGOT_PASSWORD} className="text-foreground font-medium underline">
          Quên mật khẩu?
        </Link>
      </p>
      <p className="text-muted-foreground text-center text-sm">
        Chưa có tài khoản?{" "}
        <Link href={PATH.REGISTER} className="text-foreground font-medium underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
