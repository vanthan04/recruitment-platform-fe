import type { AuthUser } from "@/lib/types/auth";
import RecruiterLayout from "../layout";

/**
 * The actual RBAC enforcement boundary for /recruiter/** on the frontend —
 * same rationale as admin/__tests__/layout.test.tsx (code review F12) —
 * plus the onboarding-completeness check this layout also owns.
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

function makeRecruiter(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "recruiter@example.com",
    role: "RECRUITER",
    status: "ACTIVE",
    companyId: "company-1",
    profile: {
      id: "profile-1",
      fullName: "Test Recruiter",
      birthDate: null,
      gender: "MALE",
      phoneNumber: "0900000000",
      avatarUrl: null,
      headline: null,
      summary: null,
    },
    ...overrides,
  };
}

describe("RecruiterLayout", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockGetCurrentUser.mockReset();
  });

  it("redirects to /login when there is no signed-in user", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(RecruiterLayout({ children: <div>recruiter content</div> })).rejects.toThrow(
      "REDIRECT:/login",
    );
  });

  it("redirects a signed-in CANDIDATE to /jobs, never rendering recruiter content", async () => {
    mockGetCurrentUser.mockResolvedValue(makeRecruiter({ role: "CANDIDATE" }));

    await expect(RecruiterLayout({ children: <div>recruiter content</div> })).rejects.toThrow(
      "REDIRECT:/jobs",
    );
  });

  it("redirects a signed-in ADMIN to /jobs, never rendering recruiter content", async () => {
    mockGetCurrentUser.mockResolvedValue(makeRecruiter({ role: "ADMIN" }));

    await expect(RecruiterLayout({ children: <div>recruiter content</div> })).rejects.toThrow(
      "REDIRECT:/jobs",
    );
  });

  it("redirects a RECRUITER missing a phone number to /onboarding", async () => {
    mockGetCurrentUser.mockResolvedValue(
      makeRecruiter({
        profile: {
          ...makeRecruiter().profile,
          phoneNumber: null,
        },
      }),
    );

    await expect(RecruiterLayout({ children: <div>recruiter content</div> })).rejects.toThrow(
      "REDIRECT:/onboarding",
    );
  });

  it("redirects a RECRUITER missing gender to /onboarding", async () => {
    mockGetCurrentUser.mockResolvedValue(
      makeRecruiter({
        profile: {
          ...makeRecruiter().profile,
          gender: null,
        },
      }),
    );

    await expect(RecruiterLayout({ children: <div>recruiter content</div> })).rejects.toThrow(
      "REDIRECT:/onboarding",
    );
  });

  it("redirects a RECRUITER with no company to /onboarding — covers deep-linking into /recruiter/** without going through login's redirect first", async () => {
    mockGetCurrentUser.mockResolvedValue(makeRecruiter({ companyId: null }));

    await expect(RecruiterLayout({ children: <div>recruiter content</div> })).rejects.toThrow(
      "REDIRECT:/onboarding",
    );
  });

  it("renders the recruiter content for a fully onboarded RECRUITER, without redirecting", async () => {
    mockGetCurrentUser.mockResolvedValue(makeRecruiter());

    const result = await RecruiterLayout({
      children: <div>recruiter content</div>,
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual(<>{<div>recruiter content</div>}</>);
  });
});
