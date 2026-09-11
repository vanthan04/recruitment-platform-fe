import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { login } from "@/lib/services/auth.service";
import { LoginForm } from "../login-form";

jest.mock("@/lib/services/auth.service", () => ({
  login: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedLogin = login as jest.Mock;

describe("LoginForm", () => {
  beforeEach(() => {
    mockedLogin.mockClear();
  });

  it("shows validation errors and does not submit for invalid input", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Mật khẩu"), "123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Email không hợp lệ")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu tối thiểu 6 ký tự")).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });

  it("submits the entered credentials", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() =>
      expect(mockedLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      }),
    );
  });
});
