import { formatDateTimeVN, formatDurationVi, formatTimeVN } from "../format";

describe("Vietnam-time formatting", () => {
  it("renders UTC instants in Vietnam time (UTC+7) whatever the runtime time zone", () => {
    expect(formatTimeVN("2026-11-09T03:04:05.000Z")).toBe("10:04:05");
    expect(formatDateTimeVN("2026-11-09T20:00:00.000Z")).toContain("10/11/2026");
  });

  it("formats durations in Vietnamese", () => {
    expect(formatDurationVi(12_000)).toBe("12 giây");
    expect(formatDurationVi(60_000)).toBe("1 phút");
    expect(formatDurationVi(95_400)).toBe("1 phút 35 giây");
    expect(formatDurationVi(-5)).toBe("0 giây");
  });
});
