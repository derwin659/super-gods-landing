import { apiRequest, getApiBaseUrl } from './apiClient';

export async function loginBasic(email, password) {
  return apiRequest('/api/auth/login-basic', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });
}

export async function loginFinal({ userId, tenantId, mode }) {
  const payload = {
    userId,
    mode,
  };

  if (tenantId !== null && tenantId !== undefined) {
    payload.tenantId = tenantId;
  }

  return apiRequest('/api/auth/login-final', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: String(email || '').trim(),
    }),
  });
}

export async function resetPassword({ email, code, newPassword }) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: String(email || '').trim(),
      code: String(code || '').trim(),
      newPassword: String(newPassword || '').trim(),
    }),
  });
}

export function googleLoginUrl({ mode = 'OWNER' } = {}) {
  const configured = import.meta.env.VITE_GOOGLE_LOGIN_URL;
  const redirectUri = `${window.location.origin}/auth/google/callback`;

  if (!configured) {
    const url = new URL('/api/auth/google/start', getApiBaseUrl());
    url.searchParams.set('mode', String(mode || 'OWNER').toUpperCase());
    url.searchParams.set('redirectUri', redirectUri);
    return url.toString();
  }

  const url = new URL(configured);
  url.searchParams.set('mode', String(mode || 'OWNER').toUpperCase());
  url.searchParams.set('redirectUri', redirectUri);
  return url.toString();
}

export function googleSignupUrl() {
  const configured = import.meta.env.VITE_GOOGLE_LOGIN_URL;
  const redirectUri = `${window.location.origin}/registro-negocio`;

  if (!configured) {
    const url = new URL('/api/auth/google/start', getApiBaseUrl());
    url.searchParams.set('mode', 'SIGNUP');
    url.searchParams.set('redirectUri', redirectUri);
    return url.toString();
  }

  const url = new URL(configured);
  url.searchParams.set('mode', 'SIGNUP');
  url.searchParams.set('redirectUri', redirectUri);
  return url.toString();
}

export function isGoogleLoginConfigured() {
  return true;
}

export async function startGoogleAccountLink() {
  const configured = import.meta.env.VITE_GOOGLE_LINK_URL;
  const redirectUri = `${window.location.origin}/owner/seguridad`;

  if (!configured) {
    return apiRequest(
      `/api/internal/me/google-link/start?redirectUri=${encodeURIComponent(redirectUri)}`,
      { method: 'POST' },
    );
  }

  const url = new URL(configured);
  url.searchParams.set('redirectUri', redirectUri);
  return { url: url.toString() };
}

export function isGoogleLinkConfigured() {
  return true;
}
