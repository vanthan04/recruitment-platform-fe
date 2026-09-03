import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getUnreadNotificationCount } from "@/lib/services/notification.service";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationCount() : 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header user={user} unreadCount={unreadCount} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SidebarProvider>
  );
}
