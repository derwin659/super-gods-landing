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