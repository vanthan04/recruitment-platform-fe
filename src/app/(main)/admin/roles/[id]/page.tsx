import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getPermissions, getRole, getRolePermissions } from "@/lib/services/admin-role.service";
import { RolePermissionsForm } from "./role-permissions-form";

// ADMIN-only guard lives in admin/layout.tsx.
export default async function AdminRoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getRoleOr404(id);
  const [allPermissions, assignedPermissions] = await Promise.all([getPermissions(), getRolePermissions(id)]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">{role.name}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{role.description}</p>

      <RolePermissionsForm
        role={role}
        allPermissions={allPermissions}
        assignedPermissionIds={assignedPermissions.map((p) => p.id)}
      />
    </div>
  );
}

async function getRoleOr404(id: string) {
  try {
    return await getRole(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
