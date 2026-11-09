import Link from "next/link";
import { ScanEye } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/shared/back-link";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { Alert } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/error";
import { MONITORING_EVENT_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getInterview } from "@/lib/services/interview.service";
import { getDetectionEvents, getDetectionSummary } from "@/lib/services/monitoring.service";
import { MONITORING_EVENT_TYPES, type MonitoringEventType } from "@/lib/types/monitoring";
import { cn } from "@/lib/utils";
import { EventTimeline } from "./event-timeline";
import { SessionList } from "./session-list";
import { SummaryCards } from "./summary-cards";

const PAGE_SIZE = 20;

type Filters = { type?: MonitoringEventType; reviewed?: "true" | "false" };

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export default async function InterviewMonitoringPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; type?: string; reviewed?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);

  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filters: Filters = {
    type: MONITORING_EVENT_TYPES.find((t) => t === sp.type),
    reviewed: sp.reviewed === "true" || sp.reviewed === "false" ? sp.reviewed : undefined,
  };

  let interview;
  try {
    interview = await getInterview(id);
  } catch (error) {
    // Not found and "not a participant" look the same to the visitor.
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }
  const isRecruiter = interview.viewerRole === "RECRUITER";

  const [summary, { items: events, meta }] = await Promise.all([
    getDetectionSummary(id),
    getDetectionEvents(id, {
      page,
      limit: PAGE_SIZE,
      eventType: filters.type,
      reviewed: filters.reviewed === undefined ? undefined : filters.reviewed === "true",
    }),
  ]);
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const everMonitored = summary.sessions.some((s) => s.monitoringConsentAt);
  const filtered = Boolean(filters.type || filters.reviewed);

  const href = (next: Filters & { page?: number }) => {
    const query = new URLSearchParams();
    if (next.type) query.set("type", next.type);
    if (next.reviewed) query.set("reviewed", next.reviewed);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const qs = query.toString();
    return `${PATH.INTERVIEW_MONITORING(id)}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <BackLink href={PATH.INTERVIEW_DETAIL(id)} label="Quay lại buổi phỏng vấn" />
        <h1 className="text-2xl font-semibold">Báo cáo giám sát AI</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {interview.jobTitle}
          {isRecruiter && ` · Ứng viên: ${interview.candidateName ?? "Chưa cập nhật tên"}`}
        </p>
      </div>

      <Alert>
        <p className="text-sm">
          {isRecruiter
            ? "Đây là các quan sát tự động của AI trong những phiên ứng viên đã đồng ý bật giám sát. AI có thể sai (nhầm vật thể, ánh sáng kém, góc camera). Mỗi mục chỉ là quan sát để bạn tham khảo, không phải kết luận về ứng viên."
            : "Đây là những gì nhà tuyển dụng của tin này nhìn thấy từ các phiên bạn đã bật giám sát AI. Mỗi mục chỉ là quan sát tự động của AI và có thể sai."}
        </p>
      </Alert>

      {!everMonitored ? (
        <EmptyState
          icon={ScanEye}
          title={isRecruiter ? "Ứng viên chưa bật giám sát AI" : "Bạn chưa bật giám sát AI"}
          description="Giám sát AI là tuỳ chọn của ứng viên. Không bật giám sát không ảnh hưởng tới buổi phỏng vấn."
        />
      ) : (
        <>
          <SummaryCards summary={summary} showUnreviewed={isRecruiter} />
          <SessionList sessions={summary.sessions} />

          <section aria-labelledby="monitoring-timeline-heading" className="space-y-3">
            <h2 id="monitoring-timeline-heading" className="text-sm font-semibold">
              Dòng thời gian
            </h2>
            <nav className="flex flex-wrap gap-1.5" aria-label="Lọc theo loại sự kiện">
              <FilterLink href={href({ reviewed: filters.reviewed })} active={!filters.type}>
                Tất cả
              </FilterLink>
              {MONITORING_EVENT_TYPES.map((type) => (
                <FilterLink
                  key={type}
                  href={href({ type, reviewed: filters.reviewed })}
                  active={filters.type === type}
                >
                  {MONITORING_EVENT_LABEL[type]}
                </FilterLink>
              ))}
            </nav>
            {isRecruiter && (
              <nav className="flex flex-wrap gap-1.5" aria-label="Lọc theo trạng thái xem">
                <FilterLink href={href({ type: filters.type })} active={!filters.reviewed}>
                  Mọi trạng thái
                </FilterLink>
                <FilterLink
                  href={href({ type: filters.type, reviewed: "false" })}
                  active={filters.reviewed === "false"}
                >
                  Chưa xem
                </FilterLink>
                <FilterLink
                  href={href({ type: filters.type, reviewed: "true" })}
                  active={filters.reviewed === "true"}
                >
                  Đã xem
                </FilterLink>
              </nav>
            )}

            {events.length === 0 ? (
              <EmptyState
                icon={ScanEye}
                title={filtered ? "Không có sự kiện nào khớp bộ lọc" : "AI không ghi nhận sự kiện nào"}
              />
            ) : (
              <EventTimeline events={events} interviewId={id} canReview={isRecruiter} />
            )}

            <PaginationBar
              page={page}
              totalPages={totalPages}
              hrefFor={(next) => href({ ...filters, page: next })}
            />
          </section>
        </>
      )}
    </div>
  );
}
