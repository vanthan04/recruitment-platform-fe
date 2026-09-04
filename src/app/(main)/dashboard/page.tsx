import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  Bookmark,
  FileText,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyBookmarkedJobs } from "@/lib/services/bookmark.service";
import { getMyCvs } from "@/lib/services/cv.service";
import { getMyApplications } from "@/lib/services/job-application.service";
import { getUnreadNotificationCount } from "@/lib/services/notification.service";
import { getMySavedSearches } from "@/lib/services/saved-search.service";
import { DashboardSection, type DashboardLink } from "./dashboard-section";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "CANDIDATE") redirect(PATH.PROFILE);

  const [savedJobs, applications, savedSearches, cvs, unreadCount] = await Promise.all([
    getMyBookmarkedJobs(),
    getMyApplications(),
    getMySavedSearches(),
    getMyCvs(),
    getUnreadNotificationCount(),
  ]);

  const jobLinks: DashboardLink[] = [
    { icon: Bookmark, label: "Việc làm đã lưu", href: PATH.SAVED_JOBS, count: savedJobs.length },
    { icon: Send, label: "Việc làm đã ứng tuyển", href: PATH.APPLICATIONS, count: applications.length },
    { icon: Search, label: "Tìm kiếm đã lưu", href: PATH.SAVED_SEARCHES, count: savedSearches.length },
    { icon: Sparkles, label: "Việc làm phù hợp với bạn" },
    { icon: Bell, label: "Cài đặt gợi ý việc làm" },
  ];

  const cvLinks: DashboardLink[] = [
    { icon: FileText, label: "CV của tôi", href: PATH.CV_LIST, count: cvs.length },
    { icon: FileText, label: "Cover Letter của tôi" },
    { icon: Users, label: "Nhà tuyển dụng muốn kết nối với bạn" },
    { icon: Users, label: "Nhà tuyển dụng xem hồ sơ" },
  ];

  const notifyLinks: DashboardLink[] = [
    { icon: Bell, label: "Thông báo", href: PATH.NOTIFICATIONS, count: unreadCount },
    { icon: MessageSquare, label: "Tin nhắn", href: PATH.MESSAGES },
  ];

  const accountLinks: DashboardLink[] = [
    { icon: UserRound, label: "Hồ sơ & cài đặt cá nhân", href: PATH.PROFILE },
    { icon: Shield, label: "Đổi mật khẩu & bảo mật", href: PATH.PROFILE },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={user.profile.avatarUrl ?? undefined} alt={user.profile.fullName} />
                <AvatarFallback>{user.profile.fullName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.profile.fullName}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="mt-1">
                  {user.status === "ACTIVE" ? "Tài khoản đã xác thực" : "Chưa xác thực"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <DashboardSection title="Quản lý tìm việc" icon={Search} items={jobLinks} />
          <DashboardSection title="Quản lý CV & Cover letter" icon={FileText} items={cvLinks} />
          <DashboardSection title="Thông báo & tin nhắn" icon={Bell} items={notifyLinks} />
          <DashboardSection title="Cá nhân & bảo mật" icon={Shield} items={accountLinks} />
        </aside>

        <main className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Chào mừng trở lại, {user.profile.fullName}!</h1>
            <p className="text-muted-foreground mt-1 text-sm">Đây là tổng quan hoạt động tìm việc của bạn.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile icon={FileText} value={cvs.length} label="CV" />
            <StatTile icon={Send} value={applications.length} label="Đã ứng tuyển" />
            <StatTile icon={Bookmark} value={savedJobs.length} label="Việc đã lưu" />
            <StatTile icon={Bell} value={unreadCount} label="Thông báo mới" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bắt đầu nhanh</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={PATH.JOBS}>Tìm việc làm</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PATH.CV_NEW}>Tạo CV mới</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PATH.PROFILE}>Cập nhật hồ sơ</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: typeof FileText; value: number; label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-2 text-center">
        <Icon className="text-primary size-5" />
        <span className="text-xl font-bold">{value}</span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </CardContent>
    </Card>
  );
}
