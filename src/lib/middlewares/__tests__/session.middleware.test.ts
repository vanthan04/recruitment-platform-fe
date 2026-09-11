/**
 * @jest-environment node
 *
 * withSession does a real fetch() to the backend and builds
 * NextRequest/NextResponse, whose classes extend the native
 * Request/Response — not implemented by jsdom (this project's default test
 * environment). Node's environment provides them natively (Node 18+).
 */
import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/middlewares/session.middleware";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/constants/auth";

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const request = new NextRequest(`http://localhost:3000${pathname}`);
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }
  return request;
}

function envelopeResponse(data: unknown, init: { ok?: boolean } = {}) {
  return {
    ok: init.ok ?? true,
    headers: { getSetCookie: () => [] },
    json: async () => ({ success: true, message: "OK", data, timestamp: new Date().toISOString() }),
  } as unknown as Response;
}

describe("withSession", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("does nothing when there is no refresh token to work with", async () => {
    const request = makeRequest("/jobs");
    const response = NextResponse.next();

    await withSession(request, response);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)).toBeUndefined();
  });

  it("does nothing when a valid access token already exists — no need to refresh", async () => {
    const request = makeRequest("/jobs", {
      [ACCESS_TOKEN_COOKIE]: "still-valid",
      [REFRESH_TOKEN_COOKIE]: "refresh-abc",
    });
    const response = NextResponse.next();

    await withSession(request, response);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes and sets both cookies from a JSON-body token response", async () => {
    const request = makeRequest("/jobs", { [REFRESH_TOKEN_COOKIE]: "refresh-abc" });
    const response = NextResponse.next();

    fetchMock.mockResolvedValueOnce(
      envelopeResponse({ access_token: "new-access", refresh_token: "new-refresh" }),
    );

    await withSession(request, response);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/refresh");
    expect(JSON.parse(init.body as string)).toEqual({ refreshToken: "refresh-abc" });

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)?.value).toBe("new-access");
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE)?.value).toBe("new-refresh");
  });

  it("refreshes and sets both cookies when the backend uses Set-Cookie headers instead of a JSON body", async () => {
    const request = makeRequest("/jobs", { [REFRESH_TOKEN_COOKIE]: "refresh-abc" });
    const response = NextResponse.next();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: {
        getSetCookie: () => [
          `${ACCESS_TOKEN_COOKIE}=set-cookie-access; Path=/; HttpOnly`,
          `${REFRESH_TOKEN_COOKIE}=set-cookie-refresh; Path=/; HttpOnly`,
        ],
      },
      json: async () => {
        throw new Error("should not be called when Set-Cookie headers are present");
      },
    } as unknown as Response);

    await withSession(request, response);

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)?.value).toBe("set-cookie-access");
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE)?.value).toBe("set-cookie-refresh");
  });

  it("leaves cookies untouched when the backend refresh call fails", async () => {
    const request = makeRequest("/jobs", { [REFRESH_TOKEN_COOKIE]: "refresh-abc" });
    const response = NextResponse.next();

    fetchMock.mockResolvedValueOnce(envelopeResponse(null, { ok: false }));

    await withSession(request, response);

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)).toBeUndefined();
  });

  it("swallows a network error from the backend without throwing", async () => {
    const request = makeRequest("/jobs", { [REFRESH_TOKEN_COOKIE]: "refresh-abc" });
    const response = NextResponse.next();

    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(withSession(request, response)).resolves.toBeUndefined();
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)).toBeUndefined();
  });
});
