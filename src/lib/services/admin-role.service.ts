"use server";

import { api } from "@/lib/api";
import { ADMIN_RBAC_ENDPOINT } from "@/lib/constants/endpoint";
import type { Permission, Role } from "@/lib/types/permission";

// GET routes here are gated by the ROLE_PERMISSION_MANAGE permission too
// (class-level @RequirePermissions on the BE controller), not just any
// logged-in admin — matches the ADMIN role gate this whole /admin/* tree
// already applies page-side.

export async function getRoles(): Promise<Role[]> {
  return api.get<Role[]>(ADMIN_RBAC_ENDPOINT.ROLES);
}

export async function getRole(id: string): Promise<Role> {
  return api.get<Role>(ADMIN_RBAC_ENDPOINT.ROLE_DETAIL(id));
}

export async function getPermissions(): Promise<Permission[]> {
  return api.get<Permission[]>(ADMIN_RBAC_ENDPOINT.PERMISSIONS);
}

export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  return api.get<Permission[]>(ADMIN_RBAC_ENDPOINT.ROLE_PERMISSIONS(roleId));
}

// Replaces the role's ENTIRE permission set — not a merge. The BE
// invalidates its permission cache synchronously in the same request, so
// there's no propagation delay to warn about.
export async function updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  await api.put(ADMIN_RBAC_ENDPOINT.ROLE_PERMISSIONS(roleId), { permissionIds });
}
