import { formatMessageTime, formatSalaryRange } from "@/lib/utils";

describe("formatSalaryRange", () => {
  it("returns a fallback when no salary is given", () => {
    expect(formatSalaryRange()).toBe("Thỏa thuận");
  });
});

describe("formatMessageTime", () => {
  it("shows 'Vừa xong' for a message sent seconds ago", () => {
    expect(formatMessageTime(new Date().toISOString())).toBe("Vừa xong");
  });

  it("shows minutes-ago for a message sent under an hour ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatMessageTime(fiveMinutesAgo)).toBe("5 phút trước");
  });

  it("falls back to the relative-day format for older messages", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatMessageTime(twoDaysAgo)).toBe("2 ngày trước");
  });
});
