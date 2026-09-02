export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED";
export type Gender = "MALE" | "FEMALE" | "OTHER";

// The public register form only ever offers these two — ADMIN is a valid
// backend value but must never be a self-service choice (per API guide note
// #8: registration doesn't gate it, so the frontend has to).
export type PublicUserRole = Extract<UserRole, "CANDIDATE" | "RECRUITER">;

export interface UserProfile {
  id: string;
  fullName: string;
  birthDate: string | null;
  gender: Gender | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  headline: string | null;
  summary: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: string | null;
  profile: UserProfile;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// The wire shape returned by /auth/login and /auth/refresh.
export interface AuthTokensWire {
  access_token: string;
  refresh_token: string;
}

export function toAuthTokens(wire: AuthTokensWire): AuthTokens {
  return { accessToken: wire.access_token, refreshToken: wire.refresh_token };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: PublicUserRole;
}

export interface VerifyEmailInput {
  code: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  code: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  gender?: Gender;
  birthDate?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

// Describes the shape of the auth service module — useful for mocking in
// tests and for keeping the service and its consumers in sync.
export type AuthOperation = {
  register: (input: RegisterInput) => Promise<void>;
  verifyEmail: (input: VerifyEmailInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
};
