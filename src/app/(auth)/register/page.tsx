import Link from "next/link";
import { PATH } from "@/lib/constants/path";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Đăng ký</h1>
        <p className="text-muted-foreground text-sm">Tạo tài khoản để bắt đầu tìm việc</p>
      </div>
      <RegisterForm />
      <p className="text-muted-foreground text-center text-sm">
        Đã có tài khoản?{" "}
        <Link href={PATH.LOGIN} className="text-foreground font-medium underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
