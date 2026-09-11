import { getCurrentUser } from "@/lib/services/auth.service";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/error";
import type { AuthUser } from "@/lib/types/auth";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;

describe("getCurrentUser", () => {
  const user: AuthUser = {
    id: "user-1",
    email: "candidate@example.com",
    role: "CANDIDATE",
    status: "ACTIVE",
    companyId: null,
    profile: {
      id: "profile-1",
      fullName: "Nguyen Van A",
      birthDate: null,
      gender: null,
      phoneNumber: null,
      avatarUrl: null,
      headline: null,
      summary: null,
    },
  };

  afterEach(() => {
    mockedGet.mockReset();
  });

  it("returns the user on success", async () => {
    mockedGet.mockResolvedValue(user);
    await expect(getCurrentUser()).resolves.toEqual(user);
  });

  it("returns null for a genuine 401 (unauthenticated visitor)", async () => {
    mockedGet.mockRejectedValue(new ApiError("Unauthorized", 401));
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("rethrows a non-401 ApiError instead of treating it as logged-out", async () => {
    // A transient backend 500 must not make a real signed-in user appear
    // logged out — it should surface as an error, not silently render the
    // logged-out header.
    mockedGet.mockRejectedValue(new ApiError("Internal Server Error", 500));
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 500 });
  });

  it("rethrows a non-ApiError failure (e.g. a network error)", async () => {
    mockedGet.mockRejectedValue(new Error("fetch failed"));
    await expect(getCurrentUser()).rejects.toThrow("fetch failed");
  });
});
