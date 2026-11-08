import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { register as registerUser } from "@/lib/services/auth.service";
import { RegisterForm } from "../register-form";

jest.mock("@/lib/services/auth.service", () => ({
  register: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedRegister = registerUser as jest.Mock;

describe("RegisterForm", () => {
  beforeEach(() => {
    mockedRegister.mockClear();
  });

  it("shows a validation error when the passwords don't match", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ tên"), "Nguyen Van A");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "different123");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText("Mật khẩu xác nhận không khớp")).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  // The backend rejects these (min 8, at least one letter and one digit) with a raw
  // error code — the form has to catch them first, in Vietnamese.
  it.each([
    ["too short (6 characters)", "abc123", "Mật khẩu tối thiểu 8 ký tự"],
    ["too short (7 characters)", "abcde12", "Mật khẩu tối thiểu 8 ký tự"],
    ["all digits", "12345678", "Mật khẩu phải có ít nhất một chữ cái"],
    ["all letters", "abcdefgh", "Mật khẩu phải có ít nhất một chữ số"],
  ])("blocks a password that is %s before it reaches the backend", async (_label, password, message) => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ tên"), "Nguyen Van A");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), password);
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), password);
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it("submits registration data without the confirmPassword field, defaulting to CANDIDATE", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ tên"), "Nguyen Van A");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() =>
      expect(mockedRegister).toHaveBeenCalledWith({
        email: "a@example.com",
        password: "password123",
        fullName: "Nguyen Van A",
        role: "CANDIDATE",
      }),
    );
  });

  it("submits the role selected via the role picker", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ tên"), "Nguyen Van B");
    await user.type(screen.getByLabelText("Email"), "b@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Nhà tuyển dụng" }));
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() =>
      expect(mockedRegister).toHaveBeenCalledWith(expect.objectContaining({ role: "RECRUITER" })),
    );
  });
});
