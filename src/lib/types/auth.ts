export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthActionResult {
  error?: string;
}

// Describes the shape of the auth service module — useful for mocking in
// tests and for keeping the service and its consumers in sync.
export type AuthOperation = {
  login: (input: LoginInput) => Promise<AuthActionResult>;
  register: (input: RegisterInput) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
};
