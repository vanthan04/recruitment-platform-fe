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
