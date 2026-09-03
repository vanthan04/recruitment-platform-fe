import { redirect } from "next/navigation";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getAdminUsers } from "@/lib/services/admin-user.service";
import { UserList } from "./user-list";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "ADMIN") redirect(PATH.JOBS);

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, meta } = await getAdminUsers({ page });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Quản lý người dùng</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Đổi vai trò hoặc trạng thái tài khoản của người dùng.
      </p>
      <UserList items={items} meta={meta} currentUserId={user.id} />
    </div>
  );
}
