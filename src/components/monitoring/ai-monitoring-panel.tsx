"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AiMonitoring, MonitoringStatus } from "@/hooks/use-ai-monitoring";
import { MONITORING_NOTICE_VERSION } from "@/lib/types/monitoring";
import { summarizeDetections } from "./detection-labels";

const STATUS_LABEL: Record<MonitoringStatus, string> = {
  off: "Đang tắt",
  starting: "Đang bật…",
  on: "Đang bật",
  degraded: "Gián đoạn",
  reconnecting: "Đang kết nối lại",
  ended: "Đã dừng",
  error: "Chưa bật được",
};

const ACTIVE: MonitoringStatus[] = ["on", "degraded", "reconnecting"];

/**
 * The notice the candidate agrees to. Its version (MONITORING_NOTICE_VERSION)
 * is recorded with the consent — change the version whenever this text, or what
 * happens to the data, changes.
 */
const NOTICE: string[] = [
  "Khoảng 1 lần mỗi giây, trình duyệt chụp một khung hình từ camera của bạn và gửi tới máy chủ của nền tảng để AI nhận diện vật thể: người, điện thoại, laptop, sách.",
  "Khung hình chỉ được phân tích rồi bỏ đi, không được lưu lại.",
  "Kết quả nhận diện hiện chỉ hiển thị cho bạn trên màn hình này.",
  "AI chỉ ghi nhận những gì nhìn thấy và có thể sai. AI không đánh giá bạn và không quyết định kết quả phỏng vấn.",
  "Khi bạn tắt camera, không có khung hình nào được gửi. Bạn có thể tắt giám sát bất cứ lúc nào; cuộc gọi vẫn tiếp tục bình thường.",
  "Hệ thống lưu thời điểm bạn đồng ý và phiên bản thông báo này.",
];

export function AiMonitoringPanel({ monitoring }: { monitoring: AiMonitoring }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { status, message, result, latencyMs, start, stop } = monitoring;
  const active = ACTIVE.includes(status);

  let liveText: string;
  if (status === "degraded") liveText = "AI tạm thời không phản hồi, đang bỏ qua khung hình.";
  else if (status === "reconnecting") liveText = "Mất kết nối tới máy chủ giám sát, đang thử lại…";
  else if (!result) liveText = "Đang chờ khung hình đầu tiên…";
  else if (result.detections.length === 0) liveText = "AI không thấy vật thể nào trong khung hình.";
  else liveText = `AI đang thấy: ${summarizeDetections(result.detections)}.`;

  return (
    <section aria-labelledby="ai-monitoring-heading" className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="ai-monitoring-heading" className="text-sm font-semibold">
          Giám sát AI
        </h2>
        <Badge variant={active ? "default" : "outline"}>{STATUS_LABEL[status]}</Badge>
      </div>

      {active ? (
        <>
          <p aria-live="polite" className="text-sm">
            {liveText}
            {status === "on" && latencyMs !== null && (
              <span className="text-muted-foreground"> · ~{latencyMs} ms</span>
            )}
          </p>
          <p className="text-muted-foreground text-xs">
            Đây là quan sát tự động của AI và có thể sai. Không có khung hình nào được lưu lại.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={stop}>
            Tắt giám sát AI
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Tuỳ chọn: cho AI nhận diện vật thể trong camera của bạn trong buổi phỏng vấn này. Chỉ bật khi bạn
            đồng ý.
          </p>
          {status === "ended" && (
            <p className="text-muted-foreground text-sm">Giám sát AI đã dừng vì phiên phỏng vấn kết thúc.</p>
          )}
          {message && (
            <p role="alert" className="text-destructive text-sm">
              {message}
            </p>
          )}
          <Button
            type="button"
            size="sm"
            disabled={status === "starting"}
            onClick={() => {
              setAgreed(false);
              setOpen(true);
            }}
          >
            {status === "starting" ? "Đang bật…" : "Bật giám sát AI"}
          </Button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bật giám sát AI cho buổi phỏng vấn này?</DialogTitle>
            <DialogDescription>Vui lòng đọc kỹ trước khi đồng ý.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {NOTICE.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>Tôi đã đọc thông báo trên và đồng ý bật giám sát AI.</span>
          </label>
          <p className="text-muted-foreground text-xs">Phiên bản thông báo: {MONITORING_NOTICE_VERSION}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Không bật
            </Button>
            <Button
              type="button"
              disabled={!agreed}
              onClick={() => {
                setOpen(false);
                void start();
              }}
            >
              Đồng ý và bật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
