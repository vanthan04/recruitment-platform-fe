function currencyFormatter(currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 });
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = "VND",
): string {
  if (!min && !max) return "Thỏa thuận";
  const formatter = currencyFormatter(currency);
  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
  if (min) return `Từ ${formatter.format(min)}`;
  if (max) return `Lên đến ${formatter.format(max)}`;
  return "Thỏa thuận";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

/** Whole calendar days between now and an expiry ISO date (negative once past). */
export function daysUntil(iso: string): number {
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Finer-grained than formatRelativeDate — minutes/hours today, then day-relative. */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return formatRelativeDate(iso);
}

// Interview times are shown in Vietnam time explicitly: these pages render on
// the server (Vercel runs in UTC), so relying on the runtime's own time zone
// would shift every timestamp by 7 hours.
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** "09/11/2026 17:05:12" in Vietnam time. */
export function formatDateTimeVN(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: VN_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** "17:05:12" in Vietnam time. */
export function formatTimeVN(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    timeZone: VN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** 12_000 -> "12 giây", 95_000 -> "1 phút 35 giây". */
export function formatDurationVi(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} giây`;
  return seconds === 0 ? `${minutes} phút` : `${minutes} phút ${seconds} giây`;
}
