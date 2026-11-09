import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { cn } from "@/lib/utils";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getMyInterviews } from "@/lib/services/interview.service";
import type { InterviewListParams } from "@/lib/types/interview";
import { InterviewList } from "./interview-list";

type Tab = "upcoming" | "in-progress" | "completed" | "all";

const TABS: { value: Tab; label: string; empty: string }[] = [
  { value: "upcoming", label: "Sắp tới", empty: "Chưa có buổi phỏng vấn sắp tới" },
  { value: "in-progress", label: "Đang diễn ra", empty: "Không có buổi phỏng vấn nào đang diễn ra" },
  { value: "completed", label: "Đã hoàn thành", empty: "Chưa có buổi phỏng vấn nào hoàn thành" },
  { value: "all", label: "Tất cả", empty: "Chưa có buổi phỏng vấn nào" },
];

const TAB_FILTER: Record<Tab, InterviewListParams> = {
  upcoming: { upcoming: true },
  "in-progress": { inProgress: true },
  completed: { status: "COMPLETED" },
  all: {},
};

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
  const tab: Tab = TABS.some((t) => t.value === sp.tab) ? (sp.tab as Tab) : "upcoming";
  const page = Math.max(1, Number(sp.page) || 1);

  const { items, meta } = await getMyInterviews({ page, ...TAB_FILTER[tab] });
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Lịch phỏng vấn</h1>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b" aria-label="Bộ lọc lịch phỏng vấn">
        {TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={`${PATH.INTERVIEWS}?tab=${value}`}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
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
          title={TABS.find((t) => t.value === tab)!.empty}
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
