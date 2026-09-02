export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes — matches the backend's access token expiry
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches the backend's refresh token expiry

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const ACCESS_TOKEN_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: ACCESS_TOKEN_MAX_AGE,
};

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: REFRESH_TOKEN_MAX_AGE,
};
