import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants/auth";
import { PATH } from "@/lib/constants/path";

// Every one of these pages also does its own server-side getCurrentUser()
// check (see their page.tsx/layout.tsx) — this list is a fast, edge-only
// redirect for the *unauthenticated* case, not the source of truth for
// access control. Keeping it exhaustive still matters: without an entry
// here, a logged-out hit on that page pays a real backend round-trip
// before being redirected, instead of the cheap cookie-presence check.
const PROTECTED_PREFIXES = [
  PATH.PROFILE,
  PATH.ONBOARDING,
  PATH.DASHBOARD,
  PATH.CV_LIST,
  PATH.APPLICATIONS,
  PATH.SAVED_JOBS,
  PATH.MESSAGES,
  PATH.NOTIFICATIONS,
  PATH.SAVED_SEARCHES,
  "/recruiter",
  "/admin",
];
const GUEST_ONLY_PATHS = [
  PATH.LOGIN,
  PATH.REGISTER,
  PATH.VERIFY_EMAIL,
  PATH.FORGOT_PASSWORD,
  PATH.RESET_PASSWORD,
];

// Cookie-presence check only — fast, edge-safe, no backend round trip.
// Pages that need the token to actually be *valid* (e.g. profile/page.tsx)
// re-verify against the backend via getCurrentUser().
export function withAuth(request: NextRequest, response: NextResponse): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(
    response.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
  );

  if (!isAuthenticated && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = PATH.LOGIN;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && GUEST_ONLY_PATHS.includes(pathname as (typeof GUEST_ONLY_PATHS)[number])) {
    const url = request.nextUrl.clone();
    url.pathname = PATH.JOBS;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
