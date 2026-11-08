import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { updateProfile } from "@/lib/services/auth.service";
import type { AuthUser } from "@/lib/types/auth";
import { ProfileForm } from "../profile-form";

jest.mock("@/lib/services/auth.service", () => ({
  updateProfile: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedUpdateProfile = updateProfile as jest.Mock;

const user: AuthUser = {
  id: "u1",
  email: "a@example.com",
  role: "CANDIDATE",
  status: "ACTIVE",
  companyId: null,
  profile: {
    id: "p1",
    fullName: "Nguyễn Văn A",
    birthDate: null,
    gender: null,
    phoneNumber: null,
    avatarUrl: null,
    headline: null,
    summary: null,
  },
};

async function submitWithPhone(phone: string) {
  const u = userEvent.setup();
  render(<ProfileForm user={user} />);
  if (phone) await u.type(screen.getByLabelText("Số điện thoại"), phone);
  await u.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
}

describe("ProfileForm — phone number", () => {
  beforeEach(() => {
    mockedUpdateProfile.mockClear();
  });

  it.each(["abc", "12345", "09123abc78"])(
    "blocks %p before it reaches the backend, which would reject it as not a phone number",
    async (phone) => {
      await submitWithPhone(phone);

      expect(await screen.findByText("Số điện thoại không hợp lệ (ví dụ: 0912 345 678)")).toBeInTheDocument();
      expect(mockedUpdateProfile).not.toHaveBeenCalled();
    },
  );

  // Numbers the backend's @IsPhoneNumber('VN') accepts — the form must not get in their way.
  it.each(["0912345678", "0912 345 678", "+84 912 345 678", "(024) 3825 1234"])(
    "lets %p through, exactly as typed",
    async (phone) => {
      await submitWithPhone(phone);

      await waitFor(() =>
        expect(mockedUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: phone })),
      );
    },
  );

  it("leaves the phone number optional: blank is sent as undefined, not as an empty string", async () => {
    await submitWithPhone("");

    await waitFor(() =>
      expect(mockedUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: undefined })),
    );
  });
});
