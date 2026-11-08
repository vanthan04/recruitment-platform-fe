import { render, screen, act, waitFor } from "@testing-library/react";
import { UnreadMessagesBadge, UnreadMessagesSync } from "@/components/layout/unread-messages-badge";
import { getUnreadMessageCount } from "@/lib/services/chat.service";
import { notifyUnreadMessagesChanged, setUnreadMessageCount } from "@/lib/realtime/unread-messages";

let mockPathname = "/jobs";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

jest.mock("@/lib/services/chat.service", () => ({
  getUnreadMessageCount: jest.fn(),
}));

const mockGetCount = getUnreadMessageCount as jest.Mock;

// The unread count lives in a module-level store shared by every badge, so it
// carries over between tests — the first test relies on it still being empty,
// and every later one sets what it needs explicitly.
describe("UnreadMessagesBadge", () => {
  it("falls back to the server-rendered count before anything has updated the store", () => {
    render(<UnreadMessagesBadge initialCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("3 tin nhắn chưa đọc")).toBeInTheDocument();
  });

  it("renders nothing at zero", () => {
    act(() => setUnreadMessageCount(0));
    const { container } = render(<UnreadMessagesBadge initialCount={5} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("caps the visible number at 9+ but keeps the exact count for screen readers", () => {
    act(() => setUnreadMessageCount(14));
    render(<UnreadMessagesBadge initialCount={0} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
    expect(screen.getByText("14 tin nhắn chưa đọc")).toBeInTheDocument();
  });

  it("updates live when the shared count changes", () => {
    act(() => setUnreadMessageCount(1));
    render(<UnreadMessagesBadge initialCount={0} />);
    expect(screen.getByText("1")).toBeInTheDocument();

    act(() => setUnreadMessageCount(4));
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("keeps two badges (desktop + mobile nav) in step", () => {
    act(() => setUnreadMessageCount(2));
    render(
      <>
        <UnreadMessagesBadge initialCount={0} />
        <UnreadMessagesBadge initialCount={0} />
      </>,
    );
    expect(screen.getAllByText("2")).toHaveLength(2);

    act(() => setUnreadMessageCount(6));
    expect(screen.getAllByText("6")).toHaveLength(2);
  });
});

describe("UnreadMessagesSync", () => {
  beforeEach(() => {
    mockGetCount.mockReset();
    mockPathname = "/jobs";
  });

  it("seeds the shared store with the server-rendered count", () => {
    render(
      <>
        <UnreadMessagesSync initialCount={8} />
        <UnreadMessagesBadge initialCount={0} />
      </>,
    );
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(mockGetCount).not.toHaveBeenCalled();
  });

  it("refetches when the chat code announces the count may have changed", async () => {
    mockGetCount.mockResolvedValue(2);
    render(
      <>
        <UnreadMessagesSync initialCount={5} />
        <UnreadMessagesBadge initialCount={0} />
      </>,
    );

    await act(async () => {
      notifyUnreadMessagesChanged();
    });

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    expect(mockGetCount).toHaveBeenCalledTimes(1);
  });

  it("refetches when the tab regains focus", async () => {
    mockGetCount.mockResolvedValue(7);
    render(
      <>
        <UnreadMessagesSync initialCount={1} />
        <UnreadMessagesBadge initialCount={0} />
      </>,
    );

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(screen.getByText("7")).toBeInTheDocument());
  });

  it("refetches on navigation, but not on the initial render", async () => {
    mockGetCount.mockResolvedValue(3);
    const { rerender } = render(<UnreadMessagesSync initialCount={0} />);
    expect(mockGetCount).not.toHaveBeenCalled();

    mockPathname = "/applications";
    await act(async () => {
      rerender(<UnreadMessagesSync initialCount={0} />);
    });

    expect(mockGetCount).toHaveBeenCalledTimes(1);
  });

  it("lets only the latest response win when requests resolve out of order", async () => {
    let resolveFirst!: (n: number) => void;
    mockGetCount
      .mockImplementationOnce(() => new Promise<number>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(1);
    render(
      <>
        <UnreadMessagesSync initialCount={9} />
        <UnreadMessagesBadge initialCount={0} />
      </>,
    );

    await act(async () => {
      notifyUnreadMessagesChanged(); // first request — left pending
      notifyUnreadMessagesChanged(); // second request — resolves immediately with 1
    });
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());

    // The slow first response finally lands with a stale value — it must be ignored.
    await act(async () => {
      resolveFirst(5);
    });
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });
});
