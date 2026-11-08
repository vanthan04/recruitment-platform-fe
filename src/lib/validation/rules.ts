import { z } from "zod";

/**
 * Form rules that mirror what the backend enforces, so a user is told what is
 * wrong while typing instead of getting a generic error toast after a round
 * trip. The backend is still the authority — these only have to be *no
 * stricter* than it (never block something it accepts) and as close as is
 * practical.
 *
 * Keep in step with the backend:
 * - passwords: common/validators/password-strength.validator.ts
 * - lengths:   the @MaxLength(...) on the matching DTO in each module
 */

// ── Passwords ────────────────────────────────────────────────────────────────
// Register, reset-password and change-password all go through the same backend
// rules: at least 8 characters, no more than 128, and at least one letter and
// one digit. (Login deliberately has no such rule: it only checks the password
// it is given, it doesn't set one.)
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`)
  .max(PASSWORD_MAX_LENGTH, `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`)
  .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất một chữ cái")
  .regex(/\d/, "Mật khẩu phải có ít nhất một chữ số");

// ── Vietnamese phone numbers ─────────────────────────────────────────────────
// The backend uses @IsPhoneNumber('VN') (libphonenumber), which accepts many
// spellings of the same number: 0912345678, 0912 345 678, +84 912 345 678,
// 84912345678, even 912345678. Replicating its per-prefix tables here would be
// brittle, and guessing a stricter format would block numbers it accepts — so
// this only catches what is certainly wrong (letters, far too short/long) and
// leaves the exact validity to the backend.
const PHONE_SEPARATORS = /[\s().-]/g;
const PHONE_SHAPE = /^\+?\d{9,12}$/;

export function isPlausibleVietnamesePhoneNumber(value: string): boolean {
  return PHONE_SHAPE.test(value.replace(PHONE_SEPARATORS, ""));
}

export const PHONE_NUMBER_MESSAGE = "Số điện thoại không hợp lệ (ví dụ: 0912 345 678)";

/** A phone number that must be filled in. */
export const requiredPhoneNumberSchema = z
  .string()
  .refine(isPlausibleVietnamesePhoneNumber, PHONE_NUMBER_MESSAGE);

/** A phone number that may be left blank. */
export const optionalPhoneNumberSchema = z
  .string()
  .refine((value) => value === "" || isPlausibleVietnamesePhoneNumber(value), PHONE_NUMBER_MESSAGE)
  .optional();

// ── Maximum lengths (the backend's @MaxLength) ───────────────────────────────
export const MAX_LENGTH = {
  /** Job title (CreateJobDto), company name (CreateCompanyDto). */
  title: 200,
  jobLocation: 200,
  companyName: 200,
  /** Job address (CreateJobDto), company address (CreateCompanyDto). */
  address: 300,
  province: 200,
  ward: 200,
  cvTitle: 300,
} as const;

/** `z.string().max(n)` with a Vietnamese message. */
export const maxLengthMessage = (max: number) => `Tối đa ${max} ký tự`;

// Salary needs no rule here: the backend wants whole, non-negative numbers
// (@IsInt @Min(0)), and the form's <input type="number" min={0}> already enforces
// exactly that through the browser's own validation (default step of 1) before
// the form is ever submitted. A zod rule on top would only be redundant — and
// a hand-written one risks being stricter than the backend (e.g. "1e3" is valid).
