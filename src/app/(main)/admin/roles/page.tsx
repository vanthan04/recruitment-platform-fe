import Link from "next/link";
import { PATH } from "@/lib/constants/path";
import { getRoles } from "@/lib/services/admin-role.service";

// ADMIN-only guard lives in admin/layout.tsx.
export default async function AdminRolesPage() {
  const roles = await getRoles();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Vai trò & Quyền hạn</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Chọn một vai trò để xem và chỉnh sửa quyền hạn được gán.
      </p>

      <div className="space-y-3">
        {roles.map((role) => (
          <Link
            key={role.id}
            href={PATH.ADMIN_ROLE_DETAIL(role.id)}
            className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
          >
            <p className="font-medium">{role.name}</p>
            {role.description && <p className="text-muted-foreground text-sm">{role.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
