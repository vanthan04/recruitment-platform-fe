import type { FrameDetection } from "@/lib/types/monitoring";

const CLASS_LABEL: Record<string, string> = {
  person: "người",
  "cell phone": "điện thoại",
  laptop: "laptop",
  book: "sách",
};

export function classLabel(className: string): string {
  return CLASS_LABEL[className] ?? className;
}

/** "1 người, 2 điện thoại" — counts per class, in order of first appearance. */
export function summarizeDetections(detections: FrameDetection[]): string {
  const counts = new Map<string, number>();
  for (const d of detections) counts.set(d.className, (counts.get(d.className) ?? 0) + 1);
  return [...counts].map(([name, count]) => `${count} ${classLabel(name)}`).join(", ");
}
