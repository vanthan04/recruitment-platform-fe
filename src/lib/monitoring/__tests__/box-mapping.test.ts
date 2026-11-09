import { mapBoxToView } from "../box-mapping";
import { captureSize } from "../frame-capture";

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

describe("mapBoxToView", () => {
  it("scales directly when frame and view have the same aspect ratio", () => {
    expect(
      mapBoxToView(
        box(64, 36, 128, 72),
        { width: 640, height: 360 },
        { width: 320, height: 180 },
        {
          fit: "cover",
          mirrored: false,
        },
      ),
    ).toEqual({ left: 32, top: 18, width: 64, height: 36 });
  });

  it("cover: a 4:3 frame in a 16:9 view is scaled by width and cropped top/bottom", () => {
    // 640x480 -> scale 0.5 (max of 320/640, 180/480=0.375) -> 320x240, 30px cropped top and bottom.
    const out = mapBoxToView(
      box(0, 60, 640, 120),
      { width: 640, height: 480 },
      { width: 320, height: 180 },
      {
        fit: "cover",
        mirrored: false,
      },
    );
    expect(out).toEqual({ left: 0, top: 0, width: 320, height: 60 });
  });

  it("cover: clips a box that is partly in the cropped band", () => {
    const out = mapBoxToView(
      box(0, 0, 100, 100),
      { width: 640, height: 480 },
      { width: 320, height: 180 },
      {
        fit: "cover",
        mirrored: false,
      },
    );
    // y = 0*0.5 - 30 = -30 -> clipped to 0; bottom = -30 + 50 = 20.
    expect(out).toEqual({ left: 0, top: 0, width: 50, height: 20 });
  });

  it("cover: returns null for a box entirely in the cropped band", () => {
    expect(
      mapBoxToView(
        box(0, 0, 100, 40),
        { width: 640, height: 480 },
        { width: 320, height: 180 },
        {
          fit: "cover",
          mirrored: false,
        },
      ),
    ).toBeNull();
  });

  it("contain: letterboxes left and right", () => {
    // 640x480 in 320x180 -> scale 0.375 -> 240x180, 40px bars left and right.
    expect(
      mapBoxToView(
        box(0, 0, 640, 480),
        { width: 640, height: 480 },
        { width: 320, height: 180 },
        {
          fit: "contain",
          mirrored: false,
        },
      ),
    ).toEqual({ left: 40, top: 0, width: 240, height: 180 });
  });

  it("mirrored: flips the box horizontally to match a mirrored self-view", () => {
    expect(
      mapBoxToView(
        box(0, 0, 160, 90),
        { width: 640, height: 360 },
        { width: 640, height: 360 },
        {
          fit: "cover",
          mirrored: true,
        },
      ),
    ).toEqual({ left: 480, top: 0, width: 160, height: 90 });
  });

  it("returns null when the view has not been measured yet", () => {
    expect(
      mapBoxToView(
        box(0, 0, 10, 10),
        { width: 640, height: 360 },
        { width: 0, height: 0 },
        {
          fit: "cover",
          mirrored: false,
        },
      ),
    ).toBeNull();
  });
});

describe("captureSize", () => {
  it("downscales the longest side to 640 keeping the aspect ratio", () => {
    expect(captureSize(1280, 720)).toEqual({ width: 640, height: 360 });
    expect(captureSize(720, 1280)).toEqual({ width: 360, height: 640 });
  });

  it("never upscales", () => {
    expect(captureSize(320, 240)).toEqual({ width: 320, height: 240 });
  });
});
