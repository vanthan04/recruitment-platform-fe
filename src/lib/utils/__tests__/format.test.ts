import { formatSalaryRange } from "@/lib/utils";

describe("formatSalaryRange", () => {
  it("returns a fallback when no salary is given", () => {
    expect(formatSalaryRange()).toBe("Thỏa thuận");
  });
});
