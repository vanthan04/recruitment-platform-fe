"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/sidebar-context";
import { PATH } from "@/lib/constants/path";
import { logout } from "@/lib/services/auth.service";
import type { AuthUser } from "@/lib/types/auth";

export function Header({ user }: { user: AuthUser | null }) {
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
          {user && (
            <>
              <Link href={PATH.CV_LIST}>CV của tôi</Link>
              <Link href={PATH.APPLICATIONS}>Đơn ứng tuyển</Link>
              <Link href={PATH.SAVED_JOBS}>Việc đã lưu</Link>
              <Link href={PATH.MESSAGES}>Tin nhắn</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
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
