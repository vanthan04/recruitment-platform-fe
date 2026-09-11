import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { verifyEmail } from "@/lib/services/auth.service";
import { VerifyEmailForm } from "../verify-email-form";

jest.mock("@/lib/services/auth.service", () => ({
  verifyEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedVerifyEmail = verifyEmail as jest.Mock;

describe("VerifyEmailForm", () => {
  beforeEach(() => {
    mockedVerifyEmail.mockClear();
  });

  it("rejects a code that isn't 6 characters", async () => {
    const user = userEvent.setup();
    render(<VerifyEmailForm />);

    await user.type(screen.getByLabelText("Mã xác thực"), "123");
    await user.click(screen.getByRole("button", { name: "Xác thực" }));

    expect(await screen.findByText("Mã xác thực gồm 6 ký tự")).toBeInTheDocument();
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });

  it("submits the verification code", async () => {
    const user = userEvent.setup();
    render(<VerifyEmailForm />);

    await user.type(screen.getByLabelText("Mã xác thực"), "654321");
    await user.click(screen.getByRole("button", { name: "Xác thực" }));

    await waitFor(() => expect(mockedVerifyEmail).toHaveBeenCalledWith({ code: "654321" }));
  });
});
