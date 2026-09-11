import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forgotPassword } from "@/lib/services/auth.service";
import { ForgotPasswordForm } from "../forgot-password-form";

jest.mock("@/lib/services/auth.service", () => ({
  forgotPassword: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedForgotPassword = forgotPassword as jest.Mock;

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    mockedForgotPassword.mockClear();
  });

  it("rejects an invalid email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Gửi mã khôi phục" }));

    expect(await screen.findByText("Email không hợp lệ")).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it("submits the email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã khôi phục" }));

    await waitFor(() => expect(mockedForgotPassword).toHaveBeenCalledWith({ email: "user@example.com" }));
  });
});
