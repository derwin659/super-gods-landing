import { apiRequest } from './apiClient';

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