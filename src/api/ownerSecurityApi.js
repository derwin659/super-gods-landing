import { apiRequest } from './apiClient';

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export async function changeMyPassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  return apiRequest('/api/internal/me/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: text(currentPassword).trim(),
      newPassword: text(newPassword).trim(),
      confirmPassword: text(confirmPassword).trim(),
    }),
  });
}

export async function getInternalMe() {
  return apiRequest('/api/internal/me');
}