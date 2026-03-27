export interface AuthUser {
  userId: string;
  email: string;
  displayName?: string | null;
  roles: string[];
  twoFactorEnabled: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface MfaVerifyRequest {
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

export interface ProblemDetails {
  title?: string;
  status?: number;
  detail?: string;
  type?: string;
  errors?: string[];
}

export type ApiError = {
  message: string;
  status?: number;
  problem?: ProblemDetails;
};
