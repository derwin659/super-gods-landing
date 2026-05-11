import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

export async function getOwnerPromotions() {
  return apiRequest('/api/owner/promotions');
}

export async function getOwnerPromotionById(promotionId) {
  return apiRequest(`/api/owner/promotions/${promotionId}`);
}

export async function createOwnerPromotion(payload) {
  return apiRequest('/api/owner/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerPromotion({ promotionId, payload }) {
  return apiRequest(`/api/owner/promotions/${promotionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function toggleOwnerPromotion(promotionId) {
  return apiRequest(`/api/owner/promotions/${promotionId}/toggle`, {
    method: 'PATCH',
  });
}

export async function deleteOwnerPromotion(promotionId) {
  return apiRequest(`/api/owner/promotions/${promotionId}`, {
    method: 'DELETE',
  });
}

export async function uploadOwnerPromotionImage({ promotionId, file }) {
  const token = getToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${getApiBaseUrl()}/api/owner/promotions/${promotionId}/image`,
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