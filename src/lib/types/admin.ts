import type { AuthUser, UserRole, UserStatus } from "@/lib/types/auth";

// GET /admin/users returns the same shape as GET /users/me (password/verifyCode
// stripped, profile included) for every user, not just the caller.
export type AdminUser = AuthUser;

export interface AdminUserListParams {
  page?: number;
  limit?: number;
}

export interface UpdateAdminUserInput {
  status?: UserStatus;
  role?: UserRole;
}
