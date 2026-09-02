"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "@/lib/constants/auth";
import { AUTH_ENDPOINT, USER_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import {
  toAuthTokens,
  type AuthActionResult,
  type AuthTokensWire,
  type AuthUser,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "@/lib/types/auth";
import { getCookies } from "@/lib/utils/http";

function actionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export async function register(input: RegisterInput): Promise<AuthActionResult> {
  try {
    // The response is just the created user's email (still PENDING) — no
    // tokens. The user must verify then log in explicitly, not be auto-signed
    // in here.
    await api.post(AUTH_ENDPOINT.REGISTER, input, { skipAuth: true });
  } catch (error) {
    return { error: actionErrorMessage(error, "Đăng ký thất bại, vui lòng thử lại.") };
  }

  redirect(`${PATH.VERIFY_EMAIL}?email=${encodeURIComponent(input.email)}`);
}

export async function verifyEmail(input: VerifyEmailInput): Promise<AuthActionResult> {
  try {
    await api.post(AUTH_ENDPOINT.VERIFY, input, { skipAuth: true });
  } catch (error) {
    return { error: actionErrorMessage(error, "Xác thực thất bại, vui lòng thử lại.") };
  }

  redirect(PATH.LOGIN);
}

export async function login(input: LoginInput): Promise<AuthActionResult> {
  try {
    const wire = await api.post<AuthTokensWire>(AUTH_ENDPOINT.LOGIN, input, { skipAuth: true });
    const tokens = toAuthTokens(wire);
    const cookieStore = await getCookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  } catch (error) {
    return { error: actionErrorMessage(error, "Đăng nhập thất bại, vui lòng thử lại.") };
  }

  redirect(PATH.JOBS);
}

export async function logout(): Promise<void> {
  const cookieStore = await getCookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Best-effort: revoke the session server-side. Cookies are cleared
    // locally either way, so a failed/expired-token call doesn't strand the
    // user in a "logged in" state.
    await api.post(AUTH_ENDPOINT.LOGOUT, { refreshToken }).catch(() => undefined);
  }

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  redirect(PATH.LOGIN);
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<AuthActionResult> {
  try {
    await api.post(AUTH_ENDPOINT.FORGOT_PASSWORD, input, { skipAuth: true });
  } catch (error) {
    return { error: actionErrorMessage(error, "Gửi yêu cầu thất bại, vui lòng thử lại.") };
  }

  redirect(PATH.RESET_PASSWORD);
}

export async function resetPassword(input: ResetPasswordInput): Promise<AuthActionResult> {
  try {
    await api.post(AUTH_ENDPOINT.RESET_PASSWORD, input, { skipAuth: true });
  } catch (error) {
    return { error: actionErrorMessage(error, "Đặt lại mật khẩu thất bại, vui lòng thử lại.") };
  }

  redirect(PATH.LOGIN);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>(USER_ENDPOINT.ME);
  } catch {
    return null;
  }
}
