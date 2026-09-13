import "server-only";
import qs from "qs";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "@/lib/constants/auth";
import { AUTH_ENDPOINT } from "@/lib/constants/endpoint";
import { API_PREFIX, BACKEND_URL } from "@/lib/constants/service";
import { toAuthTokens, type AuthTokens, type AuthTokensWire } from "@/lib/types/auth";
import type { ApiEnvelope, ListMeta } from "@/lib/types/common";
import { getCookies, getForwardedHeaders } from "@/lib/utils/http";
import { ApiError } from "@/lib/api/error";

// Re-exported for server-side call sites that already import it from here —
// client components must import from "@/lib/api/error" directly instead
// (see that file for why).
export { ApiError };

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

  // Multipart upload — body is FormData (a File under it), never
  // JSON-stringified, and Content-Type is left for fetch to set itself
  // (it needs to include the multipart boundary).
  postForm<T>(endpoint: string, formData: FormData, options: ApiRequestOptions = {}) {
    return this.request<T>("POST", endpoint, { ...options, body: formData });
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
    // Set only on the retry recursion below, with the token this exact call
    // chain's own refresh produced — see refreshToken() for why the retry
    // can't just re-read the access token cookie itself.
    retryAccessToken?: string,
  ): Promise<ApiEnvelope<T, M>> {
    const { body, searchParams, skipAuth, headers: customHeaders, next, cache, ...rest } = options;
    const isFormData = body instanceof FormData;
    const url = this.buildUrl(endpoint, searchParams);
    const requestHeaders = await this.buildHeaders(customHeaders, skipAuth, isFormData, retryAccessToken);

    const response = await fetch(url, {
      ...rest,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      // A GET is only cacheable when the caller opts in via `next.tags` (or
      // `next.revalidate`) — everything else stays dynamic by default.
      cache: next ? cache : (cache ?? "no-store"),
      next,
    });

    if (response.status === 401 && !skipAuth && !isRetry) {
      const tokens = await this.refreshToken();
      if (tokens) {
        return this.requestEnvelope<T, M>(method, endpoint, options, true, tokens.accessToken);
      }
    }

    // 204 (delete) has no body at all — nothing to parse either way.
    if (response.status === 204) {
      return { success: true, message: "", data: undefined as T, timestamp: new Date().toISOString() };
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
    isFormData?: boolean,
    accessTokenOverride?: string,
  ): Promise<Headers> {
    const requestHeaders = new Headers(custom);
    if (!isFormData && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const forwarded = await getForwardedHeaders();
    for (const [key, value] of Object.entries(forwarded)) {
      requestHeaders.set(key, value);
    }

    if (!skipAuth) {
      const accessToken = accessTokenOverride ?? (await getCookies()).get(ACCESS_TOKEN_COOKIE)?.value;
      if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    return requestHeaders;
  }

  // Keyed by the refresh-token value rather than a single field, because
  // `api` is a module-level singleton shared across every concurrent
  // request on this server process — not just concurrent requests within
  // one page render. Two different users refreshing at the same moment must
  // never share an in-flight promise; two requests from the *same* session
  // (e.g. a page's Promise.all firing several calls with one stale access
  // token) should. The backend rotates refresh tokens and enforces
  // single-use (see recruitment-platform-be's auth module), so without this,
  // the second concurrent 401 would present an already-rotated refresh
  // token and get a hard failure instead of sharing the first call's result.
  private refreshInFlight = new Map<string, Promise<AuthTokens | null>>();

  private async refreshToken(): Promise<AuthTokens | null> {
    const cookieStore = await getCookies();
    const refreshTokenValue = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshTokenValue) return null;

    let inFlight = this.refreshInFlight.get(refreshTokenValue);
    if (!inFlight) {
      inFlight = this.exchangeRefreshToken(refreshTokenValue).finally(() => {
        this.refreshInFlight.delete(refreshTokenValue);
      });
      this.refreshInFlight.set(refreshTokenValue, inFlight);
    }

    const tokens = await inFlight;
    // next/headers' cookies() is request-scoped — even though only the
    // first caller actually made the network call above, each concurrent
    // caller still has to persist the (shared) result onto its *own*
    // request's cookie store for its own response to carry the rotation.
    if (tokens) await this.persistTokens(tokens);
    return tokens;
  }

  private async exchangeRefreshToken(refreshTokenValue: string): Promise<AuthTokens | null> {
    try {
      const wire = await this.post<AuthTokensWire>(
        AUTH_ENDPOINT.REFRESH,
        { refreshToken: refreshTokenValue },
        { skipAuth: true },
      );
      return toAuthTokens(wire);
    } catch {
      return null;
    }
  }

  private async persistTokens({ accessToken, refreshToken }: AuthTokens): Promise<void> {
    try {
      const cookieStore = await getCookies();
      cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    } catch {
      // cookies() is read-only during a Server Component render (e.g. a plain
      // GET fetch from page.tsx). The refreshed token above is still used for
      // *this* request; session.middleware.ts persists the cookie on the next
      // navigation, so the user is never stuck with a stale token for long.
    }
  }
}

export const api = new Api();
