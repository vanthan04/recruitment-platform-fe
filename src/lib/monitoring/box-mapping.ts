import type { BoundingBox } from "@/lib/types/monitoring";

export interface Size {
  width: number;
  height: number;
}

export interface ViewBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Maps a box in frame pixels onto a `<video>` element as the user sees it.
 *
 * - `cover` (what the room uses): the frame is scaled to fill the element and
 *   the overflow is cropped equally on both sides, so boxes are scaled by the
 *   larger ratio and shifted by half the cropped overflow.
 * - `contain`: scaled by the smaller ratio, letterboxed.
 * - `mirrored`: the self-view is flipped horizontally (CSS scaleX(-1)), so the
 *   box must be flipped too — but labels drawn on top must not be.
 *
 * Returns null when the box ends up entirely outside the visible area.
 */
export function mapBoxToView(
  box: BoundingBox,
  frame: Size,
  view: Size,
  options: { fit: "cover" | "contain"; mirrored: boolean },
): ViewBox | null {
  if (frame.width <= 0 || frame.height <= 0 || view.width <= 0 || view.height <= 0) return null;

  const sx = view.width / frame.width;
  const sy = view.height / frame.height;
  const scale = options.fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
  const offsetX = (view.width - frame.width * scale) / 2;
  const offsetY = (view.height - frame.height * scale) / 2;

  let left = box.x * scale + offsetX;
  const top = box.y * scale + offsetY;
  const width = box.width * scale;
  const height = box.height * scale;
  if (options.mirrored) left = view.width - (left + width);

  // Clip to the element: under `cover` part of the frame is not visible.
  const x1 = Math.max(0, left);
  const y1 = Math.max(0, top);
  const x2 = Math.min(view.width, left + width);
  const y2 = Math.min(view.height, top + height);
  if (x2 <= x1 || y2 <= y1) return null;
  return { left: x1, top: y1, width: x2 - x1, height: y2 - y1 };
}
