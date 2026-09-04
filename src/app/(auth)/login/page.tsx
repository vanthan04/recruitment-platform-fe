import Link from "next/link";
import { PATH } from "@/lib/constants/path";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold">Chào mừng quay trở lại</h1>
      <LoginForm />
      <p className="text-muted-foreground text-center text-sm">
        Bạn chưa có tài khoản?{" "}
        <Link href={PATH.REGISTER} className="text-primary font-semibold hover:underline">
          Đăng ký ngay
        </Link>
      </p>
      <div className="bg-muted rounded-xl px-4 py-3 text-center text-xs text-balance">
        Bạn gặp khó khăn khi đăng nhập? Vui lòng gọi tới số{" "}
        <span className="text-foreground font-medium">1900 1234</span> (giờ hành chính).
      </div>
    </div>
  );
}
