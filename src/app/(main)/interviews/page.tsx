import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { cn } from "@/lib/utils";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyInterviews } from "@/lib/services/interview.service";
import { InterviewList } from "./interview-list";

type Tab = "upcoming" | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "upcoming", label: "Sắp tới" },
  { value: "all", label: "Tất cả" },
];

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  // Interviews exist only between a candidate and the job's recruiter.
  if (user.role !== "CANDIDATE" && user.role !== "RECRUITER") redirect(PATH.HOME);

  const sp = await searchParams;
  const tab: Tab = sp.tab === "all" ? "all" : "upcoming";
  const page = Math.max(1, Number(sp.page) || 1);

  const { items, meta } = await getMyInterviews({ page, upcoming: tab === "upcoming" ? true : undefined });
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Lịch phỏng vấn</h1>

      <nav className="mb-6 flex gap-1 border-b" aria-label="Bộ lọc lịch phỏng vấn">
        {TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`${PATH.INTERVIEWS}?tab=${value}`}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              tab === value
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={tab === "upcoming" ? "Chưa có buổi phỏng vấn sắp tới" : "Chưa có buổi phỏng vấn nào"}
          description={
            user.role === "RECRUITER"
              ? "Đặt lịch phỏng vấn từ danh sách ứng viên của một tin tuyển dụng."
              : "Khi nhà tuyển dụng đặt lịch, buổi phỏng vấn sẽ xuất hiện ở đây."
          }
        />
      ) : (
        <InterviewList items={items} />
      )}

      <div className="mt-6">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          hrefFor={(next) => `${PATH.INTERVIEWS}?tab=${tab}&page=${next}`}
        />
      </div>
    </div>
  );
}
