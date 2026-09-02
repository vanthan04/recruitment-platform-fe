"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { AUTH_ENDPOINT, USER_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import { getCookies } from "@/lib/utils/http";
import { ACCESS_TOKEN_COOKIE, AUTH_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE } from "@/lib/constants/auth";
import type { AuthActionResult, AuthTokens, AuthUser, LoginInput, RegisterInput } from "@/lib/types/auth";

async function persistSession(tokens: AuthTokens): Promise<void> {
  const cookieStore = await getCookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, AUTH_COOKIE_OPTIONS);
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, AUTH_COOKIE_OPTIONS);
}

export async function login(input: LoginInput): Promise<AuthActionResult> {
  try {
    const payload = await api.post<{ user: AuthUser } & AuthTokens>(AUTH_ENDPOINT.LOGIN, input, {
      skipAuth: true,
    });
    await persistSession(payload);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "Đăng nhập thất bại, vui lòng thử lại." };
  }

  redirect(PATH.JOBS);
}

export async function register(input: RegisterInput): Promise<AuthActionResult> {
  try {
    const payload = await api.post<{ user: AuthUser } & AuthTokens>(AUTH_ENDPOINT.REGISTER, input, {
      skipAuth: true,
    });
    await persistSession(payload);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "Đăng ký thất bại, vui lòng thử lại." };
  }

  redirect(PATH.JOBS);
}

export async function logout(): Promise<void> {
  const cookieStore = await getCookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  redirect(PATH.LOGIN);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>(USER_ENDPOINT.ME);
  } catch {
    return null;
  }
}
