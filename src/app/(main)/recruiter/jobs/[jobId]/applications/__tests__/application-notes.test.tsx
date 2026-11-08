import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  addApplicationNote,
  deleteApplicationNote,
  getApplicationNotes,
} from "@/lib/services/job-application.service";
import type { ApplicationNote } from "@/lib/types/job-application";
import { ApplicationNotes } from "../application-notes";

jest.mock("next/navigation", () => ({ unstable_rethrow: () => {} }));
jest.mock("@/lib/services/job-application.service", () => ({
  getApplicationNotes: jest.fn(),
  addApplicationNote: jest.fn(),
  deleteApplicationNote: jest.fn(),
}));
jest.mock("@/lib/services/auth.service", () => ({ logout: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockedGet = getApplicationNotes as jest.Mock;
const mockedAdd = addApplicationNote as jest.Mock;
const mockedDelete = deleteApplicationNote as jest.Mock;

const note = (id: string, content: string): ApplicationNote => ({
  id,
  content,
  authorId: "recruiter-1",
  createdAt: "2026-06-10T09:00:00.000Z",
});

async function openNotes() {
  const user = userEvent.setup();
  render(<ApplicationNotes applicationId="app-1" />);
  await user.click(screen.getByRole("button", { name: /Ghi chú nội bộ/ }));
  return user;
}

describe("ApplicationNotes", () => {
  beforeEach(() => {
    mockedGet.mockReset().mockResolvedValue([]);
    mockedAdd.mockReset();
    mockedDelete.mockReset().mockResolvedValue(undefined);
  });

  it("starts collapsed and loads nothing until opened", () => {
    render(<ApplicationNotes applicationId="app-1" />);

    expect(screen.getByRole("button", { name: /Ghi chú nội bộ/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("loads the notes when opened, newest first as the server returns them, with a count", async () => {
    mockedGet.mockResolvedValue([note("n2", "Vòng 2: tốt"), note("n1", "Vòng 1: ổn")]);
    await openNotes();

    expect(mockedGet).toHaveBeenCalledWith("app-1");
    const items = await screen.findAllByRole("listitem");
    expect(items.map((li) => within(li).getByText(/Vòng/).textContent)).toEqual([
      "Vòng 2: tốt",
      "Vòng 1: ổn",
    ]);
    expect(screen.getByRole("button", { name: /Ghi chú nội bộ \(2\)/ })).toBeInTheDocument();
  });

  it("says so when there are no notes, and that they are private", async () => {
    await openNotes();

    expect(await screen.findByText("Chưa có ghi chú nào.")).toBeInTheDocument();
    expect(screen.getByText(/ứng viên không bao giờ thấy/)).toBeInTheDocument();
  });

  it("loads only once, even when closed and opened again", async () => {
    const user = await openNotes();
    await screen.findByText("Chưa có ghi chú nào.");

    await user.click(screen.getByRole("button", { name: /Ghi chú nội bộ/ }));
    await user.click(screen.getByRole("button", { name: /Ghi chú nội bộ/ }));

    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it("adds a trimmed note to the top and clears the box", async () => {
    mockedGet.mockResolvedValue([note("n1", "Cũ")]);
    mockedAdd.mockResolvedValue(note("n2", "Mới"));
    const user = await openNotes();
    await screen.findByText("Cũ");

    await user.type(screen.getByRole("textbox", { name: "Ghi chú mới" }), "  Mới  ");
    await user.click(screen.getByRole("button", { name: "Thêm ghi chú" }));

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledWith("app-1", "Mới"));
    const items = await screen.findAllByRole("listitem");
    expect(within(items[0]).getByText("Mới")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ghi chú mới" })).toHaveValue("");
  });

  it("does not allow adding an empty or whitespace-only note", async () => {
    const user = await openNotes();
    const add = screen.getByRole("button", { name: "Thêm ghi chú" });
    expect(add).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "Ghi chú mới" }), "   ");
    expect(add).toBeDisabled();
  });

  it("keeps what was typed when adding fails", async () => {
    mockedAdd.mockRejectedValue(new Error("boom"));
    const user = await openNotes();

    await user.type(screen.getByRole("textbox", { name: "Ghi chú mới" }), "Quan trọng");
    await user.click(screen.getByRole("button", { name: "Thêm ghi chú" }));

    await waitFor(() => expect(mockedAdd).toHaveBeenCalled());
    expect(screen.getByRole("textbox", { name: "Ghi chú mới" })).toHaveValue("Quan trọng");
  });

  it("asks before deleting, and removes the note once confirmed", async () => {
    mockedGet.mockResolvedValue([note("n1", "Xoá tôi")]);
    const user = await openNotes();
    await screen.findByText("Xoá tôi");

    await user.click(screen.getByRole("button", { name: "Xoá ghi chú" }));
    expect(await screen.findByText("Xoá ghi chú này?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xoá" }));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("app-1", "n1"));
    await waitFor(() => expect(screen.queryByText("Xoá tôi")).not.toBeInTheDocument());
  });

  it("keeps the note when deleting is cancelled", async () => {
    mockedGet.mockResolvedValue([note("n1", "Giữ tôi")]);
    const user = await openNotes();
    await screen.findByText("Giữ tôi");

    await user.click(screen.getByRole("button", { name: "Xoá ghi chú" }));
    await user.click(await screen.findByRole("button", { name: "Huỷ" }));

    expect(mockedDelete).not.toHaveBeenCalled();
    expect(screen.getByText("Giữ tôi")).toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    mockedGet.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce([note("n1", "Đã tải")]);
    const user = await openNotes();

    expect(await screen.findByText("Không tải được ghi chú.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByText("Đã tải")).toBeInTheDocument();
    expect(screen.queryByText("Không tải được ghi chú.")).not.toBeInTheDocument();
  });

  it("shows how much of the 2000-character limit is used", async () => {
    const user = await openNotes();
    await user.type(screen.getByRole("textbox", { name: "Ghi chú mới" }), "abc");
    expect(screen.getByText("3/2000")).toBeInTheDocument();
  });
});
