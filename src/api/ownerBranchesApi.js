import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

export async function getOwnerBranches({ onlyActive } = {}) {
  const path = onlyActive
    ? '/api/owner/branches/active'
    : '/api/owner/branches';

  return apiRequest(path);
}

export async function createOwnerBranch(payload) {
  return apiRequest('/api/owner/branches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerBranch({ branchId, payload }) {
  return apiRequest(`/api/owner/branches/${branchId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateOwnerBranchStatus({ branchId, activo }) {
  return apiRequest(`/api/owner/branches/${branchId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  });
}

export async function uploadOwnerBranchImage({ branchId, file }) {
  const token = getToken();
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(
    `${getApiBaseUrl()}/api/owner/branches/${branchId}/image`,
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

export async function deleteOwnerBranchImage(branchId) {
  return apiRequest(`/api/owner/branches/${branchId}/image`, {
    method: 'DELETE',
  });
}
export async function getPublicAffiliatedBranchDetail(branchId) {
  return apiRequest(`/api/public/affiliated-branches/${branchId}`);
}
