import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "@/lib/constants/auth";
import { PATH } from "@/lib/constants/path";
import { exchangeSocialCode } from "@/lib/services/auth.service";
import { needsRecruiterOnboarding } from "@/lib/types/auth";

// A Route Handler, not a page — completeSocialLogin() used to set the
// access/refresh token cookies via next/headers cookies() and then call
// next/navigation's redirect(), but that combo (a "use server" function
// invoked as a plain call from a Route Handler, not dispatched from a client
// form/transition) doesn't reliably land the Set-Cookie on the resulting
// redirect. Building the NextResponse explicitly and attaching cookies to it
// directly has no such ambiguity — the cookie always rides on exactly the
// response we return.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`${PATH.LOGIN}?error=${error}`, request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL(PATH.LOGIN, request.url));
  }

  let tokens, user;
  try {
    ({ tokens, user } = await exchangeSocialCode(code));
  } catch {
    return NextResponse.redirect(new URL(`${PATH.LOGIN}?error=oauth`, request.url));
  }

  const target = user && needsRecruiterOnboarding(user) ? PATH.ONBOARDING : PATH.JOBS;
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  return response;
}
