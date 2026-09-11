import { api } from "@/lib/api";
import { ApiError } from "@/lib/api/error";
import { getCookies, getForwardedHeaders } from "@/lib/utils/http";

// The client reads/writes cookies via these two functions, which in
// production wrap next/headers' request-scoped cookies()/headers() — not
// available outside a real Next.js request. Mocking at this boundary lets
// the client's own retry/header/body logic be tested without one.
jest.mock("@/lib/utils/http", () => ({
  getCookies: jest.fn(),
  getForwardedHeaders: jest.fn(),
}));

const mockedGetCookies = getCookies as jest.Mock;
const mockedGetForwardedHeaders = getForwardedHeaders as jest.Mock;

function makeCookieStore(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: jest.fn((name: string) => (store.has(name) ? { value: store.get(name)! } : undefined)),
    set: jest.fn((name: string, value: string) => {
      store.set(name, value);
    }),
  };
}

function envelopeBody(
  data: unknown,
  overrides: Partial<{ success: boolean; message: string; code: string }> = {},
) {
  return {
    success: overrides.success ?? true,
    message: overrides.message ?? "OK",
    code: overrides.code,
    data,
    timestamp: new Date().toISOString(),
  };
}

function fakeResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
  } as Response;
}

describe("api (server-only HTTP client)", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockedGetForwardedHeaders.mockResolvedValue({});
    mockedGetCookies.mockResolvedValue(makeCookieStore());
  });

  it("attaches the access token as a Bearer header when the cookie is present", async () => {
    mockedGetCookies.mockResolvedValue(makeCookieStore({ access_token: "token-123" }));
    fetchMock.mockResolvedValueOnce(fakeResponse(envelopeBody({ ok: true })));

    await api.get("/jobs");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token-123");
  });

  it("does not attach an Authorization header when skipAuth is set, even with a token cookie present", async () => {
    mockedGetCookies.mockResolvedValue(makeCookieStore({ access_token: "token-123" }));
    fetchMock.mockResolvedValueOnce(fakeResponse(envelopeBody({ ok: true })));

    await api.get("/public/jobs", { skipAuth: true });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).has("Authorization")).toBe(false);
  });

  it("refreshes the token exactly once on a 401 and retries the original request", async () => {
    const cookieStore = makeCookieStore({ access_token: "expired-token", refresh_token: "refresh-abc" });
    mockedGetCookies.mockResolvedValue(cookieStore);

    fetchMock
      .mockResolvedValueOnce(
        fakeResponse(envelopeBody(null, { success: false, message: "Unauthorized" }), {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        }),
      )
      .mockResolvedValueOnce(
        fakeResponse(envelopeBody({ access_token: "new-token", refresh_token: "new-refresh" })),
      )
      .mockResolvedValueOnce(fakeResponse(envelopeBody({ id: "job-1" })));

    const result = await api.get<{ id: string }>("/jobs/job-1");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ id: "job-1" });

    // Middle call is the refresh request: skips auth, carries the refresh token.
    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(refreshUrl).toContain("/auth/refresh");
    expect(JSON.parse(refreshInit.body as string)).toEqual({ refreshToken: "refresh-abc" });
    expect((refreshInit.headers as Headers).has("Authorization")).toBe(false);

    // Last call retries the exact original request.
    const [retryUrl, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(retryUrl).toContain("/jobs/job-1");
    expect(retryInit.method).toBe("GET");

    // The refreshed tokens were persisted back onto the cookie store.
    expect(cookieStore.set).toHaveBeenCalledWith("access_token", "new-token", expect.anything());
    expect(cookieStore.set).toHaveBeenCalledWith("refresh_token", "new-refresh", expect.anything());
  });

  it("does not retry a second time and surfaces the original 401 when the refresh itself fails", async () => {
    mockedGetCookies.mockResolvedValue(
      makeCookieStore({ access_token: "expired-token", refresh_token: "refresh-abc" }),
    );

    fetchMock
      .mockResolvedValueOnce(
        fakeResponse(envelopeBody(null, { success: false, message: "Session expired" }), {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        }),
      )
      .mockResolvedValueOnce(
        fakeResponse(envelopeBody(null, { success: false, message: "Invalid refresh token" }), {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
        }),
      );

    await expect(api.get("/jobs/job-1")).rejects.toMatchObject({
      status: 401,
      message: "Session expired",
    });
    // Exactly 2 calls: the original request + one refresh attempt — a bug
    // here (e.g. retrying again after a failed refresh) would loop or
    // silently swallow the real error instead of surfacing it.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not call response.json() and resolves undefined data for a 204 response", async () => {
    const jsonSpy = jest.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, statusText: "No Content", json: jsonSpy });

    const result = await api.delete("/jobs/job-1");

    expect(result).toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("sends FormData bodies as-is, without JSON.stringify or a forced Content-Type", async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(envelopeBody({ url: "https://cdn.example.com/a.png" })));

    const formData = new FormData();
    formData.set("folder", "avatars");

    await api.postForm("/files/upload", formData);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(formData);
    expect((init.headers as Headers).has("Content-Type")).toBe(false);
  });

  it("throws an ApiError carrying the backend's status/message/code for a non-401 error response", async () => {
    fetchMock.mockResolvedValueOnce(
      fakeResponse(envelopeBody(null, { success: false, message: "Job not found", code: "JOB_NOT_FOUND" }), {
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(api.get("/jobs/missing")).rejects.toMatchObject({
      status: 404,
      message: "Job not found",
      code: "JOB_NOT_FOUND",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-throws ApiError as a real instance so callers can narrow on it", async () => {
    fetchMock.mockResolvedValueOnce(
      fakeResponse(envelopeBody(null, { success: false, message: "Boom" }), { ok: false, status: 500 }),
    );

    await expect(api.get("/jobs")).rejects.toBeInstanceOf(ApiError);
  });
});
