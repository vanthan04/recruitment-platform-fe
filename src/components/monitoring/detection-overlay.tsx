"use client";

import { useEffect, useRef, useState } from "react";
import { mapBoxToView, type Size } from "@/lib/monitoring/box-mapping";
import type { FrameDetectionResult } from "@/lib/types/monitoring";
import { classLabel } from "./detection-labels";

/**
 * Draws detection boxes over a `<video>` that uses `object-fit: cover`. Must be
 * placed in the same positioned box as the video (absolute, inset 0). Pass
 * `mirrored` for the self-view: boxes are flipped to match, labels stay readable.
 */
export function DetectionOverlay({
  result,
  mirrored,
}: {
  result: FrameDetectionResult | null;
  mirrored: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setView({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const frame = result ? { width: result.imageWidth, height: result.imageHeight } : null;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {result &&
        frame &&
        result.detections.map((d, index) => {
          const box = mapBoxToView(d.boundingBox, frame, view, { fit: "cover", mirrored });
          if (!box) return null;
          return (
            <div
              key={`${d.classId}-${index}`}
              data-testid="detection-box"
              className="absolute rounded-sm border-2 border-amber-400"
              style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            >
              <span className="absolute -top-4 left-0 rounded-sm bg-amber-400 px-1 text-[10px] leading-4 font-medium whitespace-nowrap text-black">
                {classLabel(d.className)} {Math.round(d.confidence * 100)}%
              </span>
            </div>
          );
        })}
    </div>
  );
}
