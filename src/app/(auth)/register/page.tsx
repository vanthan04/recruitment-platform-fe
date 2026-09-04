import Link from "next/link";
import { PATH } from "@/lib/constants/path";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Đăng ký</h1>
        <p className="text-muted-foreground text-sm">Tạo tài khoản miễn phí, tìm kiếm hàng nghìn việc làm.</p>
      </div>
      <RegisterForm />
      <p className="text-muted-foreground text-center text-sm">
        Bạn đã có tài khoản?{" "}
        <Link href={PATH.LOGIN} className="text-primary font-semibold hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
      <div className="bg-muted rounded-xl px-4 py-3 text-center text-xs text-balance">
        Bạn gặp khó khăn khi tạo tài khoản? Vui lòng gọi tới số{" "}
        <span className="text-foreground font-medium">1900 1234</span> (giờ hành chính).
      </div>
    </div>
  );
}
