import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Hồ sơ của tôi</h1>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Họ tên</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>
    </div>
  );
}
