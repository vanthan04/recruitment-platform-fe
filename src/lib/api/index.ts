import "server-only";
import qs from "qs";
import { ACCESS_TOKEN_COOKIE, AUTH_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE } from "@/lib/constants/auth";
import { AUTH_ENDPOINT } from "@/lib/constants/endpoint";
import { API_PREFIX, BACKEND_URL } from "@/lib/constants/service";
import type { ApiEnvelope, ListMeta } from "@/lib/types/common";
import { getCookies, getForwardedHeaders } from "@/lib/utils/http";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: Record<string, string>;
  // `object` (not `Record<string, unknown>`) so callers can pass an already
  // narrowly-typed params interface (e.g. JobListParams) without a cast —
  // TS only demands an index signature when the target type has one.
  searchParams?: object;
  /** Skip attaching the access token cookie, e.g. for login/register/refresh. */
  skipAuth?: boolean;
}

interface RefreshTokenPayload {
  accessToken: string;
  refreshToken: string;
}

class Api {
  get<T>(endpoint: string, options: ApiRequestOptions = {}) {
    return this.request<T>("GET", endpoint, options);
  }

  // Same as `get`, but keeps the envelope's `metadata` instead of discarding
  // it — for the paginated list endpoints, where `metadata` carries
  // {total, page, limit} (or a richer admin-only shape).
  async getPaginated<T, M = ListMeta>(
    endpoint: string,
    options: ApiRequestOptions = {},
  ): Promise<{ items: T; metadata?: M }> {
    const envelope = await this.requestEnvelope<T, M>("GET", endpoint, options);
    return { items: envelope.data, metadata: envelope.metadata };
  }

  post<T>(endpoint: string, body?: unknown, options: ApiRequestOptions = {}) {
    return this.request<T>("POST", endpoint, { ...options, body });
  }

  put<T>(endpoint: string, body?: unknown, options: ApiRequestOptions = {}) {
    return this.request<T>("PUT", endpoint, { ...options, body });
  }

  patch<T>(endpoint: string, body?: unknown, options: ApiRequestOptions = {}) {
    return this.request<T>("PATCH", endpoint, { ...options, body });
  }

  delete<T>(endpoint: string, options: ApiRequestOptions = {}) {
    return this.request<T>("DELETE", endpoint, options);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: ApiRequestOptions,
    isRetry = false,
  ): Promise<T> {
    const envelope = await this.requestEnvelope<T, unknown>(method, endpoint, options, isRetry);
    return envelope.data;
  }

  private async requestEnvelope<T, M>(
    method: string,
    endpoint: string,
    options: ApiRequestOptions,
    isRetry = false,
  ): Promise<ApiEnvelope<T, M>> {
    const { body, searchParams, skipAuth, headers: customHeaders, next, cache, ...rest } = options;
    const url = this.buildUrl(endpoint, searchParams);
    const requestHeaders = await this.buildHeaders(customHeaders, skipAuth);

    const response = await fetch(url, {
      ...rest,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      // A GET is only cacheable when the caller opts in via `next.tags` (or
      // `next.revalidate`) — everything else stays dynamic by default.
      cache: next ? cache : (cache ?? "no-store"),
      next,
    });

    if (response.status === 401 && !skipAuth && !isRetry) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.requestEnvelope<T, M>(method, endpoint, options, true);
    }

    // 204 (delete) has no body at all — nothing to parse either way.
    if (response.status === 204) {
      return { success: true, message: "", code: "SUCCESS", data: undefined as T, timestamp: "" };
    }

    const envelope = (await response.json().catch(() => undefined)) as ApiEnvelope<T, M> | undefined;

    if (!response.ok) {
      throw new ApiError(envelope?.message ?? response.statusText, response.status, envelope?.code, envelope);
    }

    if (!envelope) {
      throw new ApiError("Empty response body from backend", response.status);
    }

    return envelope;
  }

  private buildUrl(endpoint: string, searchParams?: object): string {
    const base = BACKEND_URL.replace(/\/$/, "");
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const query = searchParams
      ? qs.stringify(searchParams as Record<string, unknown>, {
          arrayFormat: "repeat",
          skipNulls: true,
          addQueryPrefix: true,
        })
      : "";
    return `${base}${API_PREFIX}${path}${query}`;
  }

  private async buildHeaders(
    custom: Record<string, string> | undefined,
    skipAuth?: boolean,
  ): Promise<Headers> {
    const requestHeaders = new Headers(custom);
    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const forwarded = await getForwardedHeaders();
    for (const [key, value] of Object.entries(forwarded)) {
      requestHeaders.set(key, value);
    }

    if (!skipAuth) {
      const cookieStore = await getCookies();
      const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
      if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    return requestHeaders;
  }

  private async refreshToken(): Promise<boolean> {
    const cookieStore = await getCookies();
    const refreshTokenValue = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshTokenValue) return false;

    try {
      const payload = await this.post<RefreshTokenPayload>(
        AUTH_ENDPOINT.REFRESH,
        { refreshToken: refreshTokenValue },
        { skipAuth: true },
      );
      await this.persistTokens(payload);
      return true;
    } catch {
      return false;
    }
  }

  private async persistTokens({ accessToken, refreshToken }: RefreshTokenPayload): Promise<void> {
    try {
      const cookieStore = await getCookies();
      cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, AUTH_COOKIE_OPTIONS);
      cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, AUTH_COOKIE_OPTIONS);
    } catch {
      // cookies() is read-only during a Server Component render (e.g. a plain
      // GET fetch from page.tsx). The refreshed token above is still used for
      // *this* request; session.middleware.ts persists the cookie on the next
      // navigation, so the user is never stuck with a stale token for long.
    }
  }
}

export const api = new Api();
