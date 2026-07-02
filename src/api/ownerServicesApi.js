import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : '';
}

export async function getOwnerServices({ onlyActive } = {}) {
  return apiRequest(
    `/api/owner/services${buildQuery({
      onlyActive,
    })}`
  );
}

export async function getOwnerServiceById(serviceId) {
  return apiRequest(`/api/owner/services/${serviceId}`);
}

export async function createOwnerService(payload) {
  return apiRequest('/api/owner/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerService({ serviceId, payload }) {
  return apiRequest(`/api/owner/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function toggleOwnerService(serviceId) {
  return apiRequest(`/api/owner/services/${serviceId}/toggle`, {
    method: 'PATCH',
  });
}

export async function uploadOwnerServiceImage({ serviceId, file }) {
  const token = getToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/api/owner/services/${serviceId}/image`, {
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
    const message =
      data?.message ||
      data?.error ||
      data?.details ||
      `Error HTTP ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function deleteOwnerServiceImage(serviceId) {
  return apiRequest(`/api/owner/services/${serviceId}/image`, {
    method: 'DELETE',
  });
}
export async function getOwnerServiceDeletionPreview(serviceId) {
  return apiRequest(`/api/owner/services/${serviceId}/deletion-preview`);
}

export async function deleteOwnerService({ serviceId, reason }) {
  return apiRequest(`/api/owner/services/${serviceId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}
