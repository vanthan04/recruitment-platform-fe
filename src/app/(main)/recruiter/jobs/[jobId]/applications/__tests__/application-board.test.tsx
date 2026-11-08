import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { updateApplicationStatus } from "@/lib/services/job-application.service";
import type { ApplicationStatus, JobApplication } from "@/lib/types/job-application";
import { ApplicationBoard } from "../application-board";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  // The real one only rethrows Next's own control-flow errors; an ordinary failure passes through.
  unstable_rethrow: () => {},
}));
jest.mock("@/lib/services/job-application.service", () => ({ updateApplicationStatus: jest.fn() }));
jest.mock("@/lib/services/auth.service", () => ({ logout: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockedUpdate = updateApplicationStatus as jest.Mock;

const app = (id: string, name: string, status: ApplicationStatus): JobApplication => ({
  id,
  status,
  coverLetter: null,
  userId: `u-${id}`,
  jobId: "job-1",
  cvId: `cv-${id}`,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  candidate: { id: `u-${id}`, fullName: name, avatarUrl: null },
});

const column = (label: string) => screen.getByRole("region", { name: `Cột ${label}` });
const card = (id: string) => screen.getByTestId(`card-${id}`);
const dataTransfer = () => ({
  setData: jest.fn(),
  getData: jest.fn().mockReturnValue(""),
  effectAllowed: "",
});

const APPLICATIONS = [
  app("a1", "Alice", "APPLIED"),
  app("a2", "Bob", "SHORTLISTED"),
  app("a3", "Carol", "OFFER"),
  app("a4", "Dave", "HIRED"),
  app("a5", "Erin", "REJECTED"),
  app("a6", "Frank", "WITHDRAWN"),
];

describe("ApplicationBoard", () => {
  beforeEach(() => {
    mockedUpdate.mockReset().mockResolvedValue(undefined);
    mockRefresh.mockClear();
    (toast.error as jest.Mock).mockClear();
  });

  describe("layout", () => {
    it("shows one column per status, in pipeline order, with the applicant count", () => {
      render(<ApplicationBoard applications={APPLICATIONS} />);

      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
      expect(headings).toEqual([
        "Đã ứng tuyển",
        "Đang sàng lọc",
        "Vào danh sách rút gọn",
        "Phỏng vấn",
        "Đề nghị (Offer)",
        "Đã tuyển",
        "Đã từ chối",
        "Đã rút đơn",
      ]);
      expect(within(column("Đã ứng tuyển")).getByText("1")).toBeInTheDocument();
      expect(within(column("Đang sàng lọc")).getByText("0")).toBeInTheDocument();
    });

    it("puts each applicant in the column of their status", () => {
      render(<ApplicationBoard applications={APPLICATIONS} />);

      expect(within(column("Đã ứng tuyển")).getByText("Alice")).toBeInTheDocument();
      expect(within(column("Vào danh sách rút gọn")).getByText("Bob")).toBeInTheDocument();
      expect(within(column("Đã rút đơn")).getByText("Frank")).toBeInTheDocument();
    });

    it("labels empty columns", () => {
      render(<ApplicationBoard applications={[]} />);
      expect(within(column("Phỏng vấn")).getByText("Trống")).toBeInTheDocument();
    });

    it("links each card to its detail in the list view", () => {
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      expect(within(card("a1")).getByRole("link", { name: "Chi tiết" })).toHaveAttribute(
        "href",
        "/recruiter/jobs/job-1/applications?view=list#application-a1",
      );
    });
  });

  describe("moving with the buttons", () => {
    it("moves an applicant one step forward at once, then confirms with the backend", async () => {
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      await user.click(screen.getByRole("button", { name: "Chuyển Alice sang Đang sàng lọc" }));

      // Optimistic: already in the new column.
      expect(within(column("Đang sàng lọc")).getByText("Alice")).toBeInTheDocument();
      expect(within(column("Đã ứng tuyển")).queryByText("Alice")).not.toBeInTheDocument();
      await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith("a1", "SCREENING"));
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    });

    it("puts the card back and tells the user when the backend refuses", async () => {
      mockedUpdate.mockRejectedValue(new Error("boom"));
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      await user.click(screen.getByRole("button", { name: "Chuyển Alice sang Đang sàng lọc" }));

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(within(column("Đã ứng tuyển")).getByText("Alice")).toBeInTheDocument();
      expect(within(column("Đang sàng lọc")).queryByText("Alice")).not.toBeInTheDocument();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("ignores a second click while the first move is still in flight", async () => {
      let resolve!: () => void;
      mockedUpdate.mockReturnValue(new Promise<void>((r) => (resolve = r)));
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      await user.click(screen.getByRole("button", { name: "Chuyển Alice sang Đang sàng lọc" }));

      expect(screen.getByRole("button", { name: "Chuyển Alice sang Vào danh sách rút gọn" })).toBeDisabled();
      expect(card("a1")).toHaveAttribute("draggable", "false");
      expect(mockedUpdate).toHaveBeenCalledTimes(1);

      resolve();
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    });

    it("does not ask for confirmation for an ordinary step", async () => {
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      await user.click(screen.getByRole("button", { name: "Chuyển Alice sang Đang sàng lọc" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("ending the process asks first (it cannot be undone)", () => {
    it("asks before rejecting, and rejects once confirmed", async () => {
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      await user.click(screen.getByRole("button", { name: "Từ chối Alice" }));
      expect(await screen.findByText("Từ chối Alice?")).toBeInTheDocument();
      expect(mockedUpdate).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Từ chối ứng viên" }));

      await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith("a1", "REJECTED"));
      expect(within(column("Đã từ chối")).getByText("Alice")).toBeInTheDocument();
    });

    it("does nothing when the rejection is cancelled", async () => {
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      await user.click(screen.getByRole("button", { name: "Từ chối Alice" }));
      await user.click(await screen.findByRole("button", { name: "Huỷ" }));

      expect(mockedUpdate).not.toHaveBeenCalled();
      expect(within(column("Đã ứng tuyển")).getByText("Alice")).toBeInTheDocument();
    });

    it("asks before hiring", async () => {
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a3", "Carol", "OFFER")]} />);

      await user.click(screen.getByRole("button", { name: "Chuyển Carol sang Đã tuyển" }));
      expect(await screen.findByText("Tuyển Carol?")).toBeInTheDocument();
      expect(mockedUpdate).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Xác nhận tuyển" }));

      await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith("a3", "HIRED"));
    });
  });

  describe("final applications", () => {
    it.each([
      ["a4", "Dave"],
      ["a5", "Erin"],
      ["a6", "Frank"],
    ])("%s (%s) cannot be dragged and has no move buttons", (id, name) => {
      render(<ApplicationBoard applications={APPLICATIONS} />);

      expect(card(id)).toHaveAttribute("draggable", "false");
      expect(within(card(id)).queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: `Từ chối ${name}` })).not.toBeInTheDocument();
    });

    it("an in-progress applicant can be dragged", () => {
      render(<ApplicationBoard applications={APPLICATIONS} />);
      expect(card("a1")).toHaveAttribute("draggable", "true");
    });
  });

  describe("drag and drop", () => {
    it("lights up only the columns the card may move to, and dims the rest", () => {
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);
      expect(column("Đang sàng lọc")).not.toHaveAttribute("data-drop-allowed");

      fireEvent.dragStart(card("a1"), { dataTransfer: dataTransfer() });

      expect(column("Đang sàng lọc")).toHaveAttribute("data-drop-allowed", "true"); // next step
      expect(column("Đã từ chối")).toHaveAttribute("data-drop-allowed", "true"); // reject
      expect(column("Vào danh sách rút gọn")).toHaveAttribute("data-drop-allowed", "false"); // skips a step
      expect(column("Đã tuyển")).toHaveAttribute("data-drop-allowed", "false");
      expect(column("Đã ứng tuyển")).toHaveAttribute("data-drop-allowed", "false"); // where it already is
      expect(column("Đã rút đơn")).toHaveAttribute("data-drop-allowed", "false"); // never a recruiter's move
    });

    it("clears the highlighting when the drag ends", () => {
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      fireEvent.dragStart(card("a1"), { dataTransfer: dataTransfer() });
      fireEvent.dragEnd(card("a1"));

      expect(column("Đang sàng lọc")).not.toHaveAttribute("data-drop-allowed");
    });

    it("only accepts a drop (cancels dragover) on a column that allows it", () => {
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);
      fireEvent.dragStart(card("a1"), { dataTransfer: dataTransfer() });

      // fireEvent returns false when the default was prevented, i.e. the drop is allowed.
      expect(fireEvent.dragOver(column("Đang sàng lọc"), { dataTransfer: dataTransfer() })).toBe(false);
      expect(fireEvent.dragOver(column("Vào danh sách rút gọn"), { dataTransfer: dataTransfer() })).toBe(
        true,
      );
    });

    it("moves the card when dropped on the next column", async () => {
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      fireEvent.dragStart(card("a1"), { dataTransfer: dataTransfer() });
      fireEvent.drop(column("Đang sàng lọc"), { dataTransfer: dataTransfer() });

      await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith("a1", "SCREENING"));
      expect(within(column("Đang sàng lọc")).getByText("Alice")).toBeInTheDocument();
    });

    it("does nothing when dropped on a column it may not move to (skipping a step)", async () => {
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      fireEvent.dragStart(card("a1"), { dataTransfer: dataTransfer() });
      fireEvent.drop(column("Vào danh sách rút gọn"), { dataTransfer: dataTransfer() });

      // Give a (wrongly) fired move the chance to show up before asserting it didn't.
      await new Promise((r) => setTimeout(r, 50));
      expect(mockedUpdate).not.toHaveBeenCalled();
      expect(within(column("Đã ứng tuyển")).getByText("Alice")).toBeInTheDocument();
    });

    it("asks for confirmation when a card is dropped on 'Đã từ chối'", async () => {
      const user = userEvent.setup();
      render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      fireEvent.dragStart(card("a1"), { dataTransfer: dataTransfer() });
      fireEvent.drop(column("Đã từ chối"), { dataTransfer: dataTransfer() });

      expect(await screen.findByText("Từ chối Alice?")).toBeInTheDocument();
      expect(mockedUpdate).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Từ chối ứng viên" }));
      await waitFor(() => expect(mockedUpdate).toHaveBeenCalledWith("a1", "REJECTED"));
    });
  });

  describe("server data", () => {
    it("takes the refreshed list from the server when no move is in flight", () => {
      const { rerender } = render(<ApplicationBoard applications={[app("a1", "Alice", "APPLIED")]} />);

      rerender(
        <ApplicationBoard applications={[app("a1", "Alice", "INTERVIEW"), app("a9", "Zed", "APPLIED")]} />,
      );

      expect(within(column("Phỏng vấn")).getByText("Alice")).toBeInTheDocument();
      expect(within(column("Đã ứng tuyển")).getByText("Zed")).toBeInTheDocument();
    });
  });
});
