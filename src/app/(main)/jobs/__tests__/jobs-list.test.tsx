import { render, screen } from "@testing-library/react";
import type { Category } from "@/lib/types/category";
import type { Job } from "@/lib/types/job";
import { JobsList } from "../jobs-list";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/jobs",
  useSearchParams: () => new URLSearchParams(),
}));

const mockJob: Job = {
  id: "1",
  title: "Frontend Developer",
  description: "Mô tả công việc",
  location: "Hà Nội",
  employmentType: "FULL_TIME",
  workMode: "ONSITE",
  level: "MIDDLE",
  status: "OPEN",
  viewCount: 0,
  companyId: "c1",
  company: { id: "c1", name: "TopCV", logoUrl: null },
  categoryId: null,
  category: null,
  skills: [],
  salaryMin: 15000000,
  salaryMax: 25000000,
  currency: "VND",
  requirements: null,
  benefits: null,
  workingHours: null,
  applicationMethod: null,
  expiresAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCategories: Category[] = [{ id: "cat1", name: "Backend", slug: "backend" }];

const baseProps = {
  meta: { total: 1, page: 1, limit: 10 },
  categories: mockCategories,
  initialKeyword: "",
  initialLocation: "",
  initialEmploymentType: "",
  initialWorkMode: "",
  initialLevel: "",
  initialCategoryId: "",
  initialSort: "",
};

describe("JobsList", () => {
  it("renders the jobs received via props from the Server Component", () => {
    render(<JobsList items={[mockJob]} {...baseProps} />);

    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText(/TopCV/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no jobs", () => {
    render(<JobsList items={[]} {...baseProps} meta={{ total: 0, page: 1, limit: 10 }} />);

    expect(screen.getByText("Không tìm thấy việc làm phù hợp.")).toBeInTheDocument();
  });
});
