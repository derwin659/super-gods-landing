const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://gods-saas-backend-production.up.railway.app';

export function getApiBaseUrl() {
  return API_URL;
}

export function getToken() {
  return localStorage.getItem('JWT_TOKEN');
}

export function authHeaders() {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.details ||
      `Error HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}