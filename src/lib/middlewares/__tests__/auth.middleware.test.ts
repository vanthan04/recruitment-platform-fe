/**
 * @jest-environment node
 *
 * withAuth is a pure function over Request/Response — no DOM needed — but
 * NextRequest/NextResponse extend the native Request/Response classes,
 * which jsdom (this project's default test environment) doesn't implement.
 * Node's environment provides them natively (Node 18+).
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middlewares/auth.middleware";
import { PATH } from "@/lib/constants/path";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants/auth";

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const request = new NextRequest(`http://localhost:3000${pathname}`);
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }
  return request;
}

describe("withAuth", () => {
  it("redirects an unauthenticated request away from a protected route to /login, preserving the destination", () => {
    const response = withAuth(makeRequest(PATH.PROFILE), NextResponse.next());

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe(PATH.LOGIN);
    expect(location.searchParams.get("redirect")).toBe(PATH.PROFILE);
  });

  it.each([PATH.ONBOARDING, "/recruiter/jobs", "/admin/users"])(
    "redirects an unauthenticated request away from protected prefix route %s",
    (pathname) => {
      const response = withAuth(makeRequest(pathname), NextResponse.next());
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe(PATH.LOGIN);
      expect(location.searchParams.get("redirect")).toBe(pathname);
    },
  );

  it("lets an unauthenticated request through to a public route", () => {
    const response = withAuth(makeRequest(PATH.JOBS), NextResponse.next());
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets an authenticated request through to a protected route", () => {
    const request = makeRequest(PATH.PROFILE, { [ACCESS_TOKEN_COOKIE]: "token" });
    const response = withAuth(request, NextResponse.next());
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an authenticated request away from a guest-only route (e.g. /login) to /jobs", () => {
    const request = makeRequest(PATH.LOGIN, { [ACCESS_TOKEN_COOKIE]: "token" });
    const response = withAuth(request, NextResponse.next());

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe(PATH.JOBS);
    expect(location.search).toBe("");
  });

  it("does not redirect a request to a route that is neither protected nor guest-only", () => {
    const response = withAuth(makeRequest("/companies"), NextResponse.next());
    expect(response.headers.get("location")).toBeNull();
  });

  it("treats a token set on the response by withSession as authenticated, even when absent from the request", () => {
    // Mirrors how middleware.ts chains withSession -> withAuth in one
    // request: a just-refreshed token lands on the outgoing `response`
    // before withAuth ever runs, not on the incoming `request`.
    const request = makeRequest(PATH.PROFILE);
    const response = NextResponse.next();
    response.cookies.set(ACCESS_TOKEN_COOKIE, "freshly-refreshed-token");

    const result = withAuth(request, response);
    expect(result.headers.get("location")).toBeNull();
  });
});
