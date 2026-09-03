import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { AvatarUpload } from "./avatar-upload";
import { ChangePasswordForm } from "./change-password-form";
import { LogoutAllButton } from "./logout-all-button";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>

      <AvatarUpload fullName={user.profile.fullName} avatarUrl={user.profile.avatarUrl} />

      <ProfileForm user={user} />

      <Separator />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Đổi mật khẩu</h2>
        <ChangePasswordForm />
      </div>

      <Separator />

      <div>
        <h2 className="mb-1 text-lg font-semibold">Phiên đăng nhập</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Đăng xuất khỏi tất cả thiết bị đang đăng nhập vào tài khoản này, kể cả thiết bị hiện tại.
        </p>
        <LogoutAllButton />
      </div>
    </div>
  );
}
