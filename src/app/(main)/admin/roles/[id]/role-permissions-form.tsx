"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useApiToast } from "@/hooks/use-api-toast";
import { updateRolePermissions } from "@/lib/services/admin-role.service";
import { ROLE_PERMISSION_MANAGE, type Permission, type Role } from "@/lib/types/permission";

interface RolePermissionsFormProps {
  role: Role;
  allPermissions: Permission[];
  assignedPermissionIds: string[];
}

function groupByResource(permissions: Permission[]): Map<string, Permission[]> {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const resource = permission.name.split(":")[0];
    const group = groups.get(resource) ?? [];
    group.push(permission);
    groups.set(resource, group);
  }
  return groups;
}

export function RolePermissionsForm({
  role,
  allPermissions,
  assignedPermissionIds,
}: RolePermissionsFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(assignedPermissionIds));
  const { run, isPending } = useApiToast();
  const router = useRouter();

  // Never let the ADMIN role's own permission-management capability be
  // unchecked through this UI — removing it here would mean no admin could
  // ever grant it back without going straight to the database.
  const isAdminRole = role.name === "ADMIN";
  const lockedPermissionId = useMemo(
    () => (isAdminRole ? allPermissions.find((p) => p.name === ROLE_PERMISSION_MANAGE)?.id : undefined),
    [isAdminRole, allPermissions],
  );

  const groups = useMemo(() => groupByResource(allPermissions), [allPermissions]);

  function toggle(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleSubmit() {
    const ids = new Set(selectedIds);
    if (lockedPermissionId) ids.add(lockedPermissionId);

    run(() => updateRolePermissions(role.id, Array.from(ids)), {
      successMessage: "Đã cập nhật quyền hạn.",
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <div className="space-y-6">
      {isAdminRole && (
        <p className="border-primary/30 bg-primary/5 rounded-lg border p-3 text-sm">
          Đây là vai trò ADMIN — quyền <code className="font-mono">{ROLE_PERMISSION_MANAGE}</code> luôn được
          giữ để tránh tự khoá quyền quản trị của chính mình.
        </p>
      )}

      {[...groups.entries()].map(([resource, permissions]) => (
        <div key={resource}>
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">{resource}</h2>
          <div className="space-y-2">
            {permissions.map((permission) => {
              const isLocked = permission.id === lockedPermissionId;
              return (
                <div key={permission.id} className="flex items-start gap-2">
                  <Checkbox
                    id={permission.id}
                    checked={isLocked || selectedIds.has(permission.id)}
                    disabled={isLocked}
                    onCheckedChange={(checked) => toggle(permission.id, checked === true)}
                  />
                  <Label htmlFor={permission.id} className="flex flex-col items-start gap-0.5 font-normal">
                    <span>{permission.description ?? permission.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">{permission.name}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Button type="button" disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </div>
  );
}
