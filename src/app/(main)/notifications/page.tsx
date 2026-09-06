import { redirect } from "next/navigation";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyNotifications } from "@/lib/services/notification.service";
import { NotificationList } from "./notification-list";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, meta } = await getMyNotifications({ page });
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thông báo</h1>
        <MarkAllReadButton />
      </div>
      <NotificationList items={items} />
      <div className="mt-6">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          hrefFor={(next) => `${PATH.NOTIFICATIONS}?page=${next}`}
        />
      </div>
    </div>
  );
}
