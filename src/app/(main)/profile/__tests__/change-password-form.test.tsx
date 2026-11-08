import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { changePassword } from "@/lib/services/auth.service";
import { ChangePasswordForm } from "../change-password-form";

jest.mock("@/lib/services/auth.service", () => ({
  changePassword: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedChangePassword = changePassword as jest.Mock;

async function fillAndSubmit(newPassword: string, confirmPassword = newPassword) {
  const user = userEvent.setup();
  render(<ChangePasswordForm />);
  await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "old-password-1");
  await user.type(screen.getByLabelText("Mật khẩu mới"), newPassword);
  await user.type(screen.getByLabelText("Xác nhận mật khẩu mới"), confirmPassword);
  await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    mockedChangePassword.mockClear();
  });

  it.each([
    ["shorter than 8 characters", "abc123", "Mật khẩu tối thiểu 8 ký tự"],
    ["all digits", "12345678", "Mật khẩu phải có ít nhất một chữ cái"],
    ["all letters", "abcdefgh", "Mật khẩu phải có ít nhất một chữ số"],
  ])("blocks a new password that is %s before it reaches the backend", async (_label, password, message) => {
    await fillAndSubmit(password);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mockedChangePassword).not.toHaveBeenCalled();
  });

  it("rejects a confirmation that does not match", async () => {
    await fillAndSubmit("password123", "password124");

    expect(await screen.findByText("Mật khẩu xác nhận không khớp")).toBeInTheDocument();
    expect(mockedChangePassword).not.toHaveBeenCalled();
  });

  it("submits the old and new password when the new one meets the backend's rules", async () => {
    await fillAndSubmit("password123");

    await waitFor(() =>
      expect(mockedChangePassword).toHaveBeenCalledWith({
        oldPassword: "old-password-1",
        newPassword: "password123",
      }),
    );
  });
});
