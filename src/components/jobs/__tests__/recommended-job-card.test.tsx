import { render, screen, within } from "@testing-library/react";
import { RecommendedJobCard } from "@/components/jobs/recommended-job-card";
import type { RecommendedJob } from "@/lib/types/job-recommendation";

const recommendation: RecommendedJob = {
  job: {
    id: "job-1",
    title: "Senior Backend Engineer",
    location: "TP. Hồ Chí Minh",
    employmentType: "FULL_TIME",
    workMode: "REMOTE",
    level: "SENIOR",
    salaryMin: 30000000,
    salaryMax: 50000000,
    currency: "VND",
    expiresAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    company: { id: "c1", name: "Acme Tech", logoUrl: null },
  },
  matchedSkills: ["NestJS", "PostgreSQL", "Docker"],
  missingSkills: ["Kubernetes"],
  matchScore: 0.75,
};

describe("RecommendedJobCard", () => {
  it("links to the job and names its company and location", () => {
    render(<RecommendedJobCard recommendation={recommendation} />);

    expect(screen.getByRole("link", { name: "Senior Backend Engineer" })).toHaveAttribute(
      "href",
      "/jobs/job-1",
    );
    expect(screen.getByText("Acme Tech")).toBeInTheDocument();
    expect(screen.getByText("TP. Hồ Chí Minh")).toBeInTheDocument();
  });

  it("says how many of the job's skills match, as a count rather than a percentage", () => {
    render(<RecommendedJobCard recommendation={recommendation} />);
    expect(screen.getByText("Khớp 3/4 kỹ năng")).toBeInTheDocument();
  });

  it("shows which skills the candidate has and which are missing", () => {
    render(<RecommendedJobCard recommendation={recommendation} />);

    const have = screen.getByRole("list", { name: "Kỹ năng bạn có" });
    expect(
      within(have)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["NestJS", "PostgreSQL", "Docker"]);
    const missing = screen.getByRole("list", { name: "Kỹ năng còn thiếu" });
    expect(
      within(missing)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(["Kubernetes"]);
  });

  it("leaves out the 'missing' section when the candidate has every skill", () => {
    render(<RecommendedJobCard recommendation={{ ...recommendation, missingSkills: [], matchScore: 1 }} />);

    expect(screen.queryByRole("list", { name: "Kỹ năng còn thiếu" })).not.toBeInTheDocument();
    expect(screen.getByText("Khớp 3/3 kỹ năng")).toBeInTheDocument();
  });

  it("shows the work mode and employment type in Vietnamese", () => {
    render(<RecommendedJobCard recommendation={recommendation} />);
    expect(screen.getByText(/Từ xa|Remote/)).toBeInTheDocument();
  });
});
