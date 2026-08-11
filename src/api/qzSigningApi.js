import { getApiBaseUrl, getToken } from './apiClient';

async function qzTextRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Error HTTP ${response.status}`);
  return text;
}

export function getQzCertificate() {
  return qzTextRequest('/api/owner/qz-signing/certificate');
}

export function signQzPayload(payload) {
  return qzTextRequest('/api/owner/qz-signing/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: payload,
  });
}