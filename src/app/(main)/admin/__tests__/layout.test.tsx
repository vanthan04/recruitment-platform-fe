import type { AuthUser } from "@/lib/types/auth";
import AdminLayout from "../layout";

/**
 * The actual RBAC enforcement boundary for /admin/** on the frontend —
 * middleware.ts only checks that a token cookie is present, never the
 * role, so this layout is the only thing standing between a signed-in
 * CANDIDATE/RECRUITER and the admin section. No coverage existed for it
 * before this (code review F12).
 */

// `mock`-prefixed names are required here — jest.mock() factories are
// hoisted above these declarations, and Jest only exempts variables whose
// name starts with "mock" from its out-of-scope-variable guard.
const mockRedirect = jest.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
jest.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

const mockGetCurrentUser = jest.fn<Promise<AuthUser | null>, []>();
jest.mock("@/lib/services/auth.service", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "user@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    companyId: null,
    profile: {
      id: "profile-1",
      fullName: "Test User",
      birthDate: null,
      gender: null,
      phoneNumber: null,
      avatarUrl: null,
      headline: null,
      summary: null,
    },
    ...overrides,
  };
}

describe("AdminLayout", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockGetCurrentUser.mockReset();
  });

  it("redirects to /login when there is no signed-in user", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(AdminLayout({ children: <div>admin content</div> })).rejects.toThrow("REDIRECT:/login");
  });

  it("redirects a signed-in CANDIDATE to /jobs, never rendering admin content", async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ role: "CANDIDATE" }));

    await expect(AdminLayout({ children: <div>admin content</div> })).rejects.toThrow("REDIRECT:/jobs");
  });

  it("redirects a signed-in RECRUITER to /jobs, never rendering admin content", async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ role: "RECRUITER" }));

    await expect(AdminLayout({ children: <div>admin content</div> })).rejects.toThrow("REDIRECT:/jobs");
  });

  it("renders the admin content for a signed-in ADMIN, without redirecting", async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ role: "ADMIN" }));

    const result = await AdminLayout({ children: <div>admin content</div> });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual(<>{<div>admin content</div>}</>);
  });
});
