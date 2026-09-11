import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetPassword } from "@/lib/services/auth.service";
import { ResetPasswordForm } from "../reset-password-form";

jest.mock("@/lib/services/auth.service", () => ({
  resetPassword: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedResetPassword = resetPassword as jest.Mock;

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    mockedResetPassword.mockClear();
  });

  it("rejects a code that isn't 6 characters", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Mã xác thực"), "123");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu mới"), "password123");
    await user.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    expect(await screen.findByText("Mã xác thực gồm 6 ký tự")).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Mã xác thực"), "123456");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu mới"), "different1");
    await user.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    expect(await screen.findByText("Mật khẩu xác nhận không khớp")).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it("submits the code and new password, without confirmPassword", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.type(screen.getByLabelText("Mã xác thực"), "123456");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu mới"), "password123");
    await user.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    await waitFor(() =>
      expect(mockedResetPassword).toHaveBeenCalledWith({
        code: "123456",
        newPassword: "password123",
      }),
    );
  });
});
