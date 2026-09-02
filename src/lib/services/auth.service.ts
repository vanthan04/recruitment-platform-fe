"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "@/lib/constants/auth";
import { AUTH_ENDPOINT, FILE_ENDPOINT, USER_ENDPOINT } from "@/lib/constants/endpoint";
import { PATH } from "@/lib/constants/path";
import {
  toAuthTokens,
  type AuthTokensWire,
  type AuthUser,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type UpdateProfileInput,
  type VerifyEmailInput,
} from "@/lib/types/auth";
import { getCookies } from "@/lib/utils/http";

export async function register(input: RegisterInput): Promise<void> {
  await api.post(AUTH_ENDPOINT.REGISTER, input, { skipAuth: true });
  redirect(`${PATH.VERIFY_EMAIL}?email=${encodeURIComponent(input.email)}`);
}

export async function verifyEmail(input: VerifyEmailInput): Promise<void> {
  await api.post(AUTH_ENDPOINT.VERIFY, input, { skipAuth: true });
  redirect(PATH.LOGIN);
}

export async function login(input: LoginInput): Promise<void> {
  const wire = await api.post<AuthTokensWire>(AUTH_ENDPOINT.LOGIN, input, { skipAuth: true });
  const tokens = toAuthTokens(wire);
  const cookieStore = await getCookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
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

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await api.post(AUTH_ENDPOINT.FORGOT_PASSWORD, input, { skipAuth: true });
  redirect(PATH.RESET_PASSWORD);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await api.post(AUTH_ENDPOINT.RESET_PASSWORD, input, { skipAuth: true });
  redirect(PATH.LOGIN);
}

export async function updateProfile(input: UpdateProfileInput): Promise<void> {
  await api.patch(USER_ENDPOINT.PROFILE, input);
  revalidatePath(PATH.PROFILE);
}

export async function updateAvatar(formData: FormData): Promise<void> {
  formData.set("folder", "avatars");
  const upload = await api.postForm<{ url: string }>(FILE_ENDPOINT.UPLOAD, formData);
  await api.patch(USER_ENDPOINT.PROFILE, { avatarUrl: upload.url });
  revalidatePath(PATH.PROFILE);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.post(AUTH_ENDPOINT.CHANGE_PASSWORD, input);
}

// --- Read-only — intentional error handling below ---

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>(USER_ENDPOINT.ME);
  } catch {
    // Unauthenticated pages call this — return null instead of crashing.
    return null;
  }
}
