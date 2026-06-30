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

export async function getOwnerBarbers({ branchId } = {}) {
  return apiRequest(`/api/owner/barbers${buildQuery({ branchId })}`);
}

export async function getOwnerBranchesForBarbers() {
  return apiRequest('/api/owner/branches');
}

export async function createOwnerBarber(payload) {
  return apiRequest('/api/owner/barbers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerBarber({ barberId, payload }) {
  return apiRequest(`/api/owner/barbers/${barberId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerBarberStatus({ barberId, activo }) {
  return apiRequest(`/api/owner/barbers/${barberId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  });
}

export async function uploadOwnerBarberPhoto({ barberId, file }) {
  const token = getToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/api/owner/barbers/${barberId}/photo`, {
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

export async function deleteOwnerBarberPhoto(barberId) {
  return apiRequest(`/api/owner/barbers/${barberId}/photo`, {
    method: 'DELETE',
  });
}
export async function getOwnerBarberCompensation({ barberId, branchId }) {
  return apiRequest(
    `/api/owner/barbers/${barberId}/compensation${buildQuery({ branchId })}`
  );
}

export async function updateOwnerBarberCompensation({ barberId, branchId, payload }) {
  return apiRequest(
    `/api/owner/barbers/${barberId}/compensation${buildQuery({ branchId })}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}
