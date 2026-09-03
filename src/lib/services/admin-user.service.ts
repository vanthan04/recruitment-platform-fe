"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { ADMIN_USER_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import type { ListMeta } from "@/lib/types/common";
import type { AdminUser, AdminUserListParams, UpdateAdminUserInput } from "@/lib/types/admin";

export async function getAdminUsers(
  params: AdminUserListParams = {},
): Promise<{ items: AdminUser[]; meta?: ListMeta }> {
  const { items, metadata } = await api.getPaginated<AdminUser[]>(ADMIN_USER_ENDPOINT.LIST, {
    searchParams: params,
  });
  return { items, meta: metadata };
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<void> {
  // PATCH /admin/users/:id returns data: null — no entity back, so the
  // caller must rely on revalidatePath/router.refresh() to see the change.
  await api.patch(ADMIN_USER_ENDPOINT.DETAIL(id), input);
  revalidatePath(PATH.ADMIN_USERS);
}
