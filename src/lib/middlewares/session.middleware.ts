import type { NextRequest, NextResponse } from "next/server";
import { parse as parseSetCookie } from "set-cookie-parser";
import { ACCESS_TOKEN_COOKIE, AUTH_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE } from "@/lib/constants/auth";
import { AUTH_ENDPOINT } from "@/lib/constants/endpoint";
import { API_PREFIX, BACKEND_URL } from "@/lib/constants/service";

interface RefreshTokenPayload {
  accessToken: string;
  refreshToken: string;
}

/**
 * Proactively refreshes the session before any Server Component renders, so
 * page.tsx never has to mutate cookies mid-render (Next only allows setting
 * cookies from a Server Action, Route Handler, or Middleware — not from a
 * plain render). Runs once per request, before auth.middleware's redirects.
 */
export async function withSession(request: NextRequest, response: NextResponse): Promise<void> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshTokenValue = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (accessToken || !refreshTokenValue) return;

  try {
    const backendResponse = await fetch(`${BACKEND_URL}${API_PREFIX}${AUTH_ENDPOINT.REFRESH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
      cache: "no-store",
    });
    if (!backendResponse.ok) return;

    // Some auth backends set the new tokens as httpOnly cookies themselves
    // (Set-Cookie) rather than returning them in the JSON body. Support both
    // shapes so this middleware works regardless of backend convention.
    const rawSetCookies = backendResponse.headers.getSetCookie?.() ?? [];
    if (rawSetCookies.length > 0) {
      for (const cookie of parseSetCookie(rawSetCookies)) {
        response.cookies.set(cookie.name, cookie.value, {
          ...AUTH_COOKIE_OPTIONS,
          path: cookie.path ?? AUTH_COOKIE_OPTIONS.path,
          maxAge: cookie.maxAge ?? AUTH_COOKIE_OPTIONS.maxAge,
        });
      }
      return;
    }

    const payload = (await backendResponse.json()) as RefreshTokenPayload;
    response.cookies.set(ACCESS_TOKEN_COOKIE, payload.accessToken, AUTH_COOKIE_OPTIONS);
    response.cookies.set(REFRESH_TOKEN_COOKIE, payload.refreshToken, AUTH_COOKIE_OPTIONS);
  } catch {
    // Backend unreachable — proceed unauthenticated; auth.middleware decides
    // whether the requested route requires a redirect.
  }
}
