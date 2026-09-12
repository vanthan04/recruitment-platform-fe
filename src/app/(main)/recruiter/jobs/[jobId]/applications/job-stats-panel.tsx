import { StatTile } from "@/components/shared/stat-tile";
import type { ApplicationStats } from "@/lib/types/job-application";

const TILES: { key: keyof ApplicationStats; label: string }[] = [
  { key: "viewCount", label: "Lượt xem" },
  { key: "totalApplications", label: "Tổng đơn" },
  { key: "applied", label: "Đã ứng tuyển" },
  { key: "screening", label: "Sàng lọc" },
  { key: "shortlisted", label: "Rút gọn" },
  { key: "interview", label: "Phỏng vấn" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Đã tuyển" },
  { key: "rejected", label: "Đã từ chối" },
  { key: "withdrawn", label: "Đã rút" },
];

export function JobStatsPanel({ stats }: { stats: ApplicationStats }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {TILES.map(({ key, label }) => (
        <StatTile key={key} value={stats[key]} label={label} />
      ))}
    </div>
  );
}
