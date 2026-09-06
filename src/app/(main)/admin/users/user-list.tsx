import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PATH } from "@/lib/constants/path";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/constants/enum-label";
import type { AdminUser } from "@/lib/types/admin";
import type { ListMeta } from "@/lib/types/common";
import { EditUserDialog } from "./edit-user-dialog";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface UserListProps {
  items: AdminUser[];
  meta?: ListMeta;
  currentUserId: string;
}

export function UserList({ items, meta, currentUserId }: UserListProps) {
  const page = meta?.page ?? 1;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  {user.profile.avatarUrl && (
                    <AvatarImage src={user.profile.avatarUrl} alt={user.profile.fullName} />
                  )}
                  <AvatarFallback>{initials(user.profile.fullName || user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {user.profile.fullName || "(chưa cập nhật tên)"}
                    {isSelf && <span className="text-muted-foreground ml-2 text-xs">(bạn)</span>}
                  </p>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">{USER_ROLE_LABEL[user.role]}</Badge>
                    <Badge variant={user.status === "BLOCKED" ? "destructive" : "secondary"}>
                      {USER_STATUS_LABEL[user.status]}
                    </Badge>
                  </div>
                </div>
              </div>
              {isSelf ? (
                <span className="text-muted-foreground text-xs">Không thể tự sửa tài khoản của mình</span>
              ) : (
                <EditUserDialog user={user} />
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">Không có người dùng nào.</p>
        )}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        hrefFor={(next) => `${PATH.ADMIN_USERS}?page=${next}`}
      />
    </div>
  );
}
