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

export async function getOwnerRewards({ onlyActive } = {}) {
  return apiRequest(`/api/owner/rewards${buildQuery({ onlyActive })}`);
}

export async function createOwnerReward(payload) {
  return apiRequest('/api/owner/rewards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerReward({ rewardId, payload }) {
  return apiRequest(`/api/owner/rewards/${rewardId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteOwnerReward(rewardId) {
  return apiRequest(`/api/owner/rewards/${rewardId}`, {
    method: 'DELETE',
  });
}

export async function uploadOwnerRewardImage({ rewardId, file }) {
  const token = getToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${getApiBaseUrl()}/api/owner/rewards/${rewardId}/image`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

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