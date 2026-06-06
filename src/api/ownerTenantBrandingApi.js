import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

export function getOwnerTenantBranding() {
  return apiRequest('/api/owner/tenant/branding');
}

export async function uploadOwnerTenantLogo(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/api/owner/tenant/branding/logo`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || data?.details || `Error HTTP ${response.status}`);
  }

  return data;
}
