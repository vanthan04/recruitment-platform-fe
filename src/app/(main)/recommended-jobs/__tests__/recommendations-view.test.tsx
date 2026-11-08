import { render, screen, within } from "@testing-library/react";
import type { JobRecommendations, RecommendedJob } from "@/lib/types/job-recommendation";
import { RecommendationsView } from "../recommendations-view";

const recommendation = (id: string, matched: string[], missing: string[] = []): RecommendedJob => ({
  job: {
    id,
    title: `Backend ${id}`,
    location: "Hà Nội",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    level: "MIDDLE",
    salaryMin: 20000000,
    salaryMax: 35000000,
    currency: "VND",
    expiresAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    company: { id: "c1", name: "Acme", logoUrl: null },
  },
  matchedSkills: matched,
  missingSkills: missing,
  matchScore: matched.length / (matched.length + missing.length),
});

const data = (overrides: Partial<JobRecommendations> = {}): JobRecommendations => ({
  hasAnalyzedCv: true,
  candidateSkills: ["nestjs", "postgresql"],
  items: [],
  ...overrides,
});

describe("RecommendationsView", () => {
  it("asks for an analyzed CV when there is none yet, pointing to the CV page", () => {
    render(<RecommendationsView data={data({ hasAnalyzedCv: false, candidateSkills: [] })} />);

    expect(screen.getByText("Cần một CV đã được phân tích")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đến trang CV" })).toHaveAttribute("href", "/cv");
    expect(screen.queryByRole("list", { name: "Việc làm được gợi ý" })).not.toBeInTheDocument();
  });

  it("explains when the analyzed CV showed no skills (rather than 'nothing matches')", () => {
    render(<RecommendationsView data={data({ candidateSkills: [] })} />);

    expect(screen.getByText("CV của bạn chưa cho thấy kỹ năng nào")).toBeInTheDocument();
    expect(screen.queryByText("Chưa có việc làm nào khớp kỹ năng của bạn")).not.toBeInTheDocument();
  });

  it("shows the skills it used, and says so when nothing matches", () => {
    render(<RecommendationsView data={data({ items: [] })} />);

    const skills = screen.getByRole("list", { name: "Kỹ năng của bạn" });
    expect(within(skills).getByText("nestjs")).toBeInTheDocument();
    expect(within(skills).getByText("postgresql")).toBeInTheDocument();
    expect(screen.getByText("Chưa có việc làm nào khớp kỹ năng của bạn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tìm việc làm" })).toHaveAttribute("href", "/jobs");
  });

  it("lists the recommended jobs in the order given (the backend's ranking)", () => {
    render(
      <RecommendationsView
        data={data({
          items: [recommendation("a", ["NestJS", "PostgreSQL"]), recommendation("b", ["NestJS"], ["Go"])],
        })}
      />,
    );

    const list = screen.getByRole("list", { name: "Việc làm được gợi ý" });
    const titles = within(list)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(titles).toEqual(["Backend a", "Backend b"]);
  });
});
