import Link from "next/link";
import { Briefcase, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenuToggle } from "@/components/layout/mobile-menu-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLink } from "@/components/layout/nav-link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { PATH } from "@/lib/constants/path";
import { logout } from "@/lib/services/auth.service";
import type { AuthUser } from "@/lib/types/auth";

type NavItem = { href: string; label: string };

// Candidates have the most nav destinations of any role, enough to overflow the
// header at common desktop widths — the least-used two are tucked into a "Thêm" menu.
function getNavLinks(user: AuthUser | null): { primary: NavItem[]; more: NavItem[] } {
  const primary: NavItem[] = [
    { href: PATH.JOBS, label: "Việc làm" },
    { href: PATH.COMPANIES, label: "Công ty" },
  ];
  const more: NavItem[] = [];

  if (user?.role === "CANDIDATE") {
    primary.push(
      { href: PATH.DASHBOARD, label: "Tổng quan" },
      { href: PATH.CV_LIST, label: "CV của tôi" },
      { href: PATH.APPLICATIONS, label: "Đơn ứng tuyển" },
      { href: PATH.MESSAGES, label: "Tin nhắn" },
    );
    more.push(
      { href: PATH.SAVED_JOBS, label: "Việc đã lưu" },
      { href: PATH.SAVED_SEARCHES, label: "Tìm kiếm đã lưu" },
    );
  } else if (user?.role === "RECRUITER") {
    primary.push(
      { href: PATH.RECRUITER_JOBS, label: "Tin tuyển dụng của tôi" },
      { href: PATH.RECRUITER_COMPANY, label: "Công ty của tôi" },
      { href: PATH.MESSAGES, label: "Tin nhắn" },
    );
  } else if (user?.role === "ADMIN") {
    primary.push(
      { href: PATH.ADMIN_USERS, label: "Người dùng" },
      { href: PATH.ADMIN_ROLES, label: "Vai trò & Quyền hạn" },
      { href: PATH.ADMIN_CATEGORIES, label: "Danh mục" },
    );
  }
  return { primary, more };
}

export function Header({ user, unreadCount = 0 }: { user: AuthUser | null; unreadCount?: number }) {
  const { primary, more } = getNavLinks(user);
  const allLinks = [...primary, ...more];

  return (
    <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href={PATH.HOME} className="flex shrink-0 items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Briefcase className="size-[18px]" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Recruitment<span className="text-primary">Platform</span>
          </span>
        </Link>

        <nav className="no-scrollbar hidden min-w-0 items-center gap-0.5 overflow-x-auto text-sm font-medium md:flex md:flex-1 md:justify-center">
          {primary.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="text-foreground/80 hover:bg-muted hover:text-foreground rounded-full px-3 py-2 whitespace-nowrap transition-colors"
              activeClassName="bg-muted text-foreground"
            >
              {link.label}
            </NavLink>
          ))}
          {more.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-foreground/80 hover:bg-muted hover:text-foreground flex shrink-0 items-center gap-1 rounded-full px-3 py-2 whitespace-nowrap outline-hidden transition-colors">
                Thêm
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52">
                {more.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <NotificationBell unreadCount={unreadCount} />
              <Link
                href={PATH.PROFILE}
                className="hover:bg-muted flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors"
              >
                <Avatar className="size-7">
                  <AvatarImage src={user.profile.avatarUrl ?? undefined} alt={user.profile.fullName} />
                  <AvatarFallback>{user.profile.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{user.profile.fullName}</span>
              </Link>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  Đăng xuất
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href={PATH.REGISTER} className="hidden sm:block">
                <Button variant="outline" size="sm" className="rounded-full">
                  Đăng ký
                </Button>
              </Link>
              <Link href={PATH.LOGIN}>
                <Button size="sm" className="rounded-full">
                  Đăng nhập
                </Button>
              </Link>
            </>
          )}
          <MobileMenuToggle />
        </div>
      </div>
      <MobileNav links={allLinks} />
    </header>
  );
}
