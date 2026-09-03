"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useSidebar } from "@/contexts/sidebar-context";
import { PATH } from "@/lib/constants/path";
import { logout } from "@/lib/services/auth.service";
import type { AuthUser } from "@/lib/types/auth";

export function Header({ user, unreadCount = 0 }: { user: AuthUser | null; unreadCount?: number }) {
  const { toggle } = useSidebar();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={PATH.HOME} className="font-semibold">
          Recruitment Platform
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href={PATH.JOBS}>Việc làm</Link>
          <Link href={PATH.COMPANIES}>Công ty</Link>
          {user && user.role === "CANDIDATE" && (
            <>
              <Link href={PATH.CV_LIST}>CV của tôi</Link>
              <Link href={PATH.APPLICATIONS}>Đơn ứng tuyển</Link>
              <Link href={PATH.SAVED_JOBS}>Việc đã lưu</Link>
              <Link href={PATH.SAVED_SEARCHES}>Tìm kiếm đã lưu</Link>
              <Link href={PATH.MESSAGES}>Tin nhắn</Link>
            </>
          )}
          {user && user.role === "RECRUITER" && (
            <>
              <Link href={PATH.RECRUITER_JOBS}>Tin tuyển dụng của tôi</Link>
              <Link href={PATH.RECRUITER_COMPANY}>Công ty của tôi</Link>
              <Link href={PATH.MESSAGES}>Tin nhắn</Link>
            </>
          )}
          {user && user.role === "ADMIN" && <Link href={PATH.ADMIN_USERS}>Quản trị</Link>}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell unreadCount={unreadCount} />
              <Link href={PATH.PROFILE} className="text-sm font-medium">
                {user.profile.fullName}
              </Link>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Đăng xuất
                </Button>
              </form>
            </>
          ) : (
            <Link href={PATH.LOGIN}>
              <Button size="sm">Đăng nhập</Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggle} aria-label="Mở menu">
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
