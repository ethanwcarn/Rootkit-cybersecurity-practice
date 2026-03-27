import { apiGet, apiPost, apiPostNoBody } from './apiClient';
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  MfaVerifyRequest,
  RegisterRequest,
} from '../types/auth';

export function register(request: RegisterRequest) {
  return apiPost<RegisterRequest, AuthResponse>('/api/auth/register', request);
}

export function login(request: LoginRequest) {
  return apiPost<LoginRequest, AuthResponse>('/api/auth/login', request);
}

export function logout() {
  return apiPostNoBody<AuthResponse>('/api/auth/logout');
}

export function getCurrentUser() {
  return apiGet<AuthUser>('/api/auth/me');
}

export function setupMfa() {
  return apiPostNoBody<{ sharedKey: string; authenticatorUri: string }>(
    '/api/auth/mfa/setup'
  );
}

export function verifyMfa(request: MfaVerifyRequest) {
  return apiPost<MfaVerifyRequest, AuthResponse>(
    '/api/auth/mfa/verify',
    request
  );
}

export function disableMfa() {
  return apiPostNoBody<AuthResponse>('/api/auth/mfa/disable');
}

export function getExternalChallengeUrl(provider: string, returnUrl = '/') {
  const encodedReturnUrl = encodeURIComponent(returnUrl);
  return `/api/auth/external/${provider}/challenge?returnUrl=${encodedReturnUrl}`;
}

export function getExternalProviders() {
  return apiGet<string[]>('/api/auth/external/providers');
}
