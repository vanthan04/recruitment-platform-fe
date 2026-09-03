"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiToast } from "@/hooks/use-api-toast";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/constants/enum-label";
import { updateAdminUser } from "@/lib/services/admin-user.service";
import type { AdminUser } from "@/lib/types/admin";
import type { UserRole, UserStatus } from "@/lib/types/auth";

const ROLES = Object.keys(USER_ROLE_LABEL) as UserRole[];
const STATUSES = Object.keys(USER_STATUS_LABEL) as UserStatus[];

export function EditUserDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const { run, isPending } = useApiToast();
  const router = useRouter();

  function handleOpenChange(next: boolean) {
    if (next) {
      setRole(user.role);
      setStatus(user.status);
    }
    setOpen(next);
  }

  function handleSubmit() {
    run(() => updateAdminUser(user.id, { role, status }), {
      successMessage: "Đã cập nhật người dùng.",
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Sửa
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa người dùng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {USER_ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as UserStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {USER_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
