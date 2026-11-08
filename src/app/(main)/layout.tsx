import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getUnreadMessageCount } from "@/lib/services/chat.service";
import { getUnreadNotificationCount } from "@/lib/services/notification.service";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // Only candidates and recruiters have a "Tin nhắn" nav link (see Header) —
  // don't fetch (or badge) a count for anyone else.
  const hasMessages = user?.role === "CANDIDATE" || user?.role === "RECRUITER";
  const [unreadCount, unreadMessageCount] = await Promise.all([
    user ? getUnreadNotificationCount() : 0,
    hasMessages ? getUnreadMessageCount() : undefined,
  ]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header user={user} unreadCount={unreadCount} unreadMessageCount={unreadMessageCount} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SidebarProvider>
  );
}
