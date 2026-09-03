export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// The one permission that lets an admin manage role<->permission
// assignments at all — must never be removed from the ADMIN role via this
// UI, or nobody could ever grant it back without going straight to the DB.
export const ROLE_PERMISSION_MANAGE = "role:permission:manage";
