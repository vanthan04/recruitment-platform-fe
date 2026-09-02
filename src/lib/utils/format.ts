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
  return `Lên đến ${formatter.format(max as number)}`;
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
