import { render, screen } from "@testing-library/react";
import type { Notification } from "@/lib/types/notification";
import { NotificationList } from "../notification-list";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const baseNotification: Notification = {
  id: "n1",
  type: "NEW_APPLICATION",
  title: "Nguyễn Văn A đã ứng tuyển",
  message: "Có ứng viên mới ứng tuyển vị trí Backend Developer",
  isRead: false,
  metadata: { applicationId: "a1", jobId: "j1" },
  createdAt: new Date().toISOString(),
};

describe("NotificationList", () => {
  it("shows an empty state when there are no notifications", () => {
    render(<NotificationList items={[]} />);
    expect(screen.getByText("Chưa có thông báo nào.")).toBeInTheDocument();
  });

  it("renders notification title and message", () => {
    render(<NotificationList items={[baseNotification]} />);
    expect(screen.getByText(baseNotification.title)).toBeInTheDocument();
    expect(screen.getByText(baseNotification.message)).toBeInTheDocument();
  });

  it("links a NEW_APPLICATION notification to the recruiter applications page", () => {
    render(<NotificationList items={[baseNotification]} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/recruiter/jobs/j1/applications");
  });

  it("links an APPLICATION_STATUS_CHANGED notification to the candidate applications page", () => {
    render(
      <NotificationList
        items={[
          { ...baseNotification, type: "APPLICATION_STATUS_CHANGED", metadata: { applicationId: "a1" } },
        ]}
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/applications");
  });
});
