import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createJob } from "@/lib/services/job.service";
import { JobForm } from "../job-form";

jest.mock("@/lib/services/job.service", () => ({
  createJob: jest.fn().mockResolvedValue(undefined),
  updateJob: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/services/auth.service", () => ({ logout: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedCreateJob = createJob as jest.Mock;

/** Fills the required fields; long values go through fireEvent.change (typing 200+ characters is slow). */
async function fillRequired(overrides: { title?: string; location?: string } = {}) {
  const user = userEvent.setup();
  fireEvent.change(screen.getByLabelText("Tiêu đề tin tuyển dụng"), {
    target: { value: overrides.title ?? "Backend Developer" },
  });
  await user.type(screen.getByLabelText("Mô tả công việc"), "Xây dựng API");
  fireEvent.change(screen.getByLabelText("Địa điểm làm việc"), {
    target: { value: overrides.location ?? "Hà Nội" },
  });
  return user;
}

describe("JobForm — limits the backend enforces", () => {
  beforeEach(() => {
    mockedCreateJob.mockClear();
    render(<JobForm mode="create" categories={[]} skills={[]} />);
  });

  it("accepts a title of exactly 200 characters", async () => {
    const user = await fillRequired({ title: "a".repeat(200) });
    await user.click(screen.getByRole("button", { name: "Đăng tin" }));

    await waitFor(() => expect(mockedCreateJob).toHaveBeenCalled());
  });

  it("blocks a title over 200 characters instead of letting the backend reject it", async () => {
    const user = await fillRequired({ title: "a".repeat(201) });
    await user.click(screen.getByRole("button", { name: "Đăng tin" }));

    expect(await screen.findByText("Tối đa 200 ký tự")).toBeInTheDocument();
    expect(mockedCreateJob).not.toHaveBeenCalled();
  });

  it("blocks a location over 200 characters", async () => {
    const user = await fillRequired({ location: "b".repeat(201) });
    await user.click(screen.getByRole("button", { name: "Đăng tin" }));

    expect(await screen.findByText("Tối đa 200 ký tự")).toBeInTheDocument();
    expect(mockedCreateJob).not.toHaveBeenCalled();
  });

  it("blocks an address over 300 characters", async () => {
    const user = await fillRequired();
    fireEvent.change(screen.getByLabelText("Địa chỉ cụ thể (không bắt buộc)"), {
      target: { value: "c".repeat(301) },
    });
    await user.click(screen.getByRole("button", { name: "Đăng tin" }));

    expect(await screen.findByText("Tối đa 300 ký tự")).toBeInTheDocument();
    expect(mockedCreateJob).not.toHaveBeenCalled();
  });
});
