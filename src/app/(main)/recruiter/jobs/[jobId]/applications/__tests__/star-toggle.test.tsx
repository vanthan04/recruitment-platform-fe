import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { setApplicationStarred } from "@/lib/services/job-application.service";
import { StarToggle } from "../star-toggle";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  unstable_rethrow: () => {},
}));
jest.mock("@/lib/services/job-application.service", () => ({ setApplicationStarred: jest.fn() }));
jest.mock("@/lib/services/auth.service", () => ({ logout: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockedSet = setApplicationStarred as jest.Mock;

describe("StarToggle", () => {
  beforeEach(() => {
    mockedSet.mockReset().mockResolvedValue({ isStarred: true });
    mockRefresh.mockClear();
    (toast.error as jest.Mock).mockClear();
  });

  it("shows the current state accessibly", () => {
    const { rerender } = render(<StarToggle applicationId="a1" starred={false} candidateName="Alice" />);
    expect(screen.getByRole("button", { name: "Đánh dấu sao Alice" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    rerender(<StarToggle applicationId="a1" starred candidateName="Alice" />);
    expect(screen.getByRole("button", { name: "Bỏ đánh dấu sao Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("stars at once, saves it, and refreshes the page data", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<StarToggle applicationId="a1" starred={false} candidateName="Alice" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Đánh dấu sao Alice" }));

    expect(screen.getByRole("button", { name: "Bỏ đánh dấu sao Alice" })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(mockedSet).toHaveBeenCalledWith("a1", true));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("unstars", async () => {
    mockedSet.mockResolvedValue({ isStarred: false });
    const user = userEvent.setup();
    render(<StarToggle applicationId="a1" starred candidateName="Alice" />);

    await user.click(screen.getByRole("button", { name: "Bỏ đánh dấu sao Alice" }));

    await waitFor(() => expect(mockedSet).toHaveBeenCalledWith("a1", false));
  });

  it("flips back, and tells the parent, when saving fails", async () => {
    mockedSet.mockRejectedValue(new Error("boom"));
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<StarToggle applicationId="a1" starred={false} candidateName="Alice" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Đánh dấu sao Alice" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Đánh dấu sao Alice" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(onChange.mock.calls).toEqual([[true], [false]]);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("is disabled while saving, so a double click can't send two requests", async () => {
    let resolve!: (v: unknown) => void;
    mockedSet.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<StarToggle applicationId="a1" starred={false} candidateName="Alice" />);

    await user.click(screen.getByRole("button", { name: "Đánh dấu sao Alice" }));
    const button = screen.getByRole("button", { name: "Bỏ đánh dấu sao Alice" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(mockedSet).toHaveBeenCalledTimes(1);

    resolve({ isStarred: true });
    await waitFor(() => expect(button).toBeEnabled());
  });
});
